/**
 * SignalField WebGL engine (W3). Client-only; dynamically imported by signal-field.tsx the first
 * time an instance nears the viewport, so none of this ships in the main bundle.
 *
 * One WebGL1 context per instance, two programs, two draw calls per frame:
 *   1. streak band (additive)  2. traces, one drawElements over a static VBO (additive)
 * Nothing here schedules frames: the caller drives draw() from useRafWhenVisible.
 */
import { compileProgram, createGL, uniformSetter } from "@/lib/gl/mini-gl"
import { STREAK_FS, STREAK_VS, TRACE_FS, TRACE_VS } from "@/lib/gl/signal-field.glsl"

export type Preset = "hero" | "horizon"

export type FieldFrame = {
  /** seconds */
  time: number
  /** canvas-x (0..1.05) of the blade; ≥ 1.05 = all calm */
  cut: number
  converge: number
  collapse: number
  /** streak vertical tightness */
  k: number
  /** streak intensity 0..1 */
  intensity: number
  /** trace alpha multiplier */
  gain: number
  /** px (backing store), y-down */
  horizon: number
  /** streak centre, px */
  flareX: number
  flareY: number
  /** pointer px + lens strength */
  px: number
  py: number
  lens: number
  /** avoid rect px (x, y, w, h); w 0 = none */
  avoid: readonly [number, number, number, number]
  /** 1 = full line count, 0.5 = adaptive half */
  quality: 1 | 0.5
}

export type SignalFieldEngine = {
  /** Resize the drawing buffer bookkeeping and (re)build geometry when L/S change. */
  resize(w: number, h: number, dpr: number, lines: number, segments: number): void
  /** Returns false when nothing could be drawn (no resources / context lost). */
  draw(f: FieldFrame): boolean
  /** Call on webglcontextlost: drop handles (the context is gone). */
  lost(): void
  /** Call on webglcontextrestored: rebuild programs + buffers. Returns false if it failed. */
  restore(): boolean
  destroy(): void
}

const hex = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
const MUTE = hex("#5D6677")
const VIOLET = hex("#8B5CF6")
const SIGNAL = hex("#22D3EE")
/** chaos amplitude, in line spacings (spec leaves uAmp to the implementation) */
const AMP = 2.3

type Res = {
  streak: WebGLProgram
  trace: WebGLProgram
  su: ReturnType<typeof uniformSetter>
  tu: ReturnType<typeof uniformSetter>
  quad: WebGLBuffer
  vbo: WebGLBuffer
  ibo: WebGLBuffer
  aPos: number
  aData: number
}

/** Build per-vertex (aLine, aT, aSide) and indices. Even lines first so a half draw = every other line. */
function buildGeometry(L: number, S: number) {
  const perLine = (S + 1) * 2
  const verts = new Float32Array(L * perLine * 3)
  const order: number[] = []
  for (let i = 0; i < L; i += 2) order.push(i)
  for (let i = 1; i < L; i += 2) order.push(i)
  let v = 0
  for (let li = 0; li < L; li++) {
    const line = L === 1 ? 0.5 : li / (L - 1)
    for (let s = 0; s <= S; s++) {
      const t = s / S
      verts[v++] = line
      verts[v++] = t
      verts[v++] = -1
      verts[v++] = line
      verts[v++] = t
      verts[v++] = 1
    }
  }
  const idx = new Uint16Array(L * S * 6)
  let k = 0
  for (const li of order) {
    const base = li * perLine
    for (let s = 0; s < S; s++) {
      const a = base + s * 2
      idx[k++] = a
      idx[k++] = a + 1
      idx[k++] = a + 2
      idx[k++] = a + 1
      idx[k++] = a + 3
      idx[k++] = a + 2
    }
  }
  return { verts, idx, evenLines: Math.ceil(L / 2) }
}

export function createSignalFieldGL(canvas: HTMLCanvasElement, preset: Preset): SignalFieldEngine | null {
  const gl = createGL(canvas)
  if (!gl) return null

  let res: Res | null = null
  let W = 1
  let H = 1
  let DPR = 1
  let L = 0
  let S = 0
  let evenLines = 0
  let geoKey = ""
  let geo: ReturnType<typeof buildGeometry> | null = null

  const init = (): boolean => {
    try {
      const streak = compileProgram(gl, STREAK_VS, STREAK_FS)
      const trace = compileProgram(gl, TRACE_VS, TRACE_FS)
      const quad = gl.createBuffer()
      const vbo = gl.createBuffer()
      const ibo = gl.createBuffer()
      if (!quad || !vbo || !ibo) return false
      gl.bindBuffer(gl.ARRAY_BUFFER, quad)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
      res = {
        streak,
        trace,
        su: uniformSetter(gl, streak),
        tu: uniformSetter(gl, trace),
        quad,
        vbo,
        ibo,
        aPos: gl.getAttribLocation(streak, "aPos"),
        aData: gl.getAttribLocation(trace, "aData"),
      }
      geoKey = ""
      if (geo) upload()
      return true
    } catch (err) {
      if (process.env.NODE_ENV !== "production") console.warn("[SignalField] GL init failed", err)
      res = null
      return false
    }
  }

  const upload = () => {
    if (!res || !geo) return
    gl.bindBuffer(gl.ARRAY_BUFFER, res.vbo)
    gl.bufferData(gl.ARRAY_BUFFER, geo.verts, gl.STATIC_DRAW)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, res.ibo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.idx, gl.STATIC_DRAW)
    geoKey = `${L}x${S}`
  }

  if (!init()) return null

  return {
    resize(w, h, dpr, lines, segments) {
      W = w
      H = h
      DPR = dpr
      if (lines !== L || segments !== S || !geo) {
        L = lines
        S = segments
        geo = buildGeometry(L, S)
        evenLines = geo.evenLines
      }
      if (res && geoKey !== `${L}x${S}`) upload()
      gl.viewport(0, 0, W, H)
    },

    draw(f) {
      if (!res || !geo || gl.isContextLost()) return false
      const { su, tu } = res
      gl.viewport(0, 0, W, H)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE)

      // pass 1: streak band
      if (f.intensity > 0.001) {
        gl.useProgram(res.streak)
        gl.bindBuffer(gl.ARRAY_BUFFER, res.quad)
        gl.enableVertexAttribArray(res.aPos)
        gl.vertexAttribPointer(res.aPos, 2, gl.FLOAT, false, 0, 0)
        su.f2("uRes", W, H)
        su.f1("uFlareY", f.flareY)
        su.f2("uFlare", f.flareX, f.flareY)
        su.f1("uK", f.k)
        su.f1("uIntensity", f.intensity)
        su.f1("uTime", f.time)
        su.f1("uDpr", DPR)
        su.f1("uWarm", preset === "horizon" ? 1 : 0)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        gl.disableVertexAttribArray(res.aPos)
      }

      // pass 2: traces
      if (f.gain > 0.001) {
        gl.useProgram(res.trace)
        gl.bindBuffer(gl.ARRAY_BUFFER, res.vbo)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, res.ibo)
        gl.enableVertexAttribArray(res.aData)
        gl.vertexAttribPointer(res.aData, 3, gl.FLOAT, false, 0, 0)
        const drawLines = f.quality === 0.5 ? evenLines : L
        tu.f2("uRes", W, H)
        tu.f1("uDpr", DPR)
        tu.f1("uPreset", preset === "horizon" ? 1 : 0)
        tu.f1("uL", L)
        tu.f1("uS", S)
        tu.f1("uSpread", 0.84 * H)
        tu.f1("uHorizon", f.horizon)
        tu.f1("uSeam", H - 1.5 * DPR)
        tu.f1("uAmp", AMP)
        tu.f1("uTime", f.time)
        tu.f1("uCut", f.cut)
        tu.f1("uConverge", f.converge)
        tu.f1("uCollapse", f.collapse)
        tu.f1("uMid", L > 1 ? Math.round((L - 1) / 2) / (L - 1) : 0.5)
        tu.f3("uPointer", f.px, f.py, f.lens)
        tu.f1("uGain", f.gain)
        tu.f4("uAvoid", f.avoid[0], f.avoid[1], f.avoid[2], f.avoid[3])
        tu.f3("uMute", MUTE[0], MUTE[1], MUTE[2])
        tu.f3("uViolet", VIOLET[0], VIOLET[1], VIOLET[2])
        tu.f3("uSignal", SIGNAL[0], SIGNAL[1], SIGNAL[2])
        gl.drawElements(gl.TRIANGLES, drawLines * S * 6, gl.UNSIGNED_SHORT, 0)
        gl.disableVertexAttribArray(res.aData)
      }
      return true
    },

    lost() {
      res = null
      geoKey = ""
    },

    restore() {
      return init()
    },

    destroy() {
      if (res && !gl.isContextLost()) {
        gl.deleteProgram(res.streak)
        gl.deleteProgram(res.trace)
        gl.deleteBuffer(res.quad)
        gl.deleteBuffer(res.vbo)
        gl.deleteBuffer(res.ibo)
      }
      res = null
    },
  }
}
