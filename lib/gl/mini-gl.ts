/**
 * Minimal WebGL1 helpers for hand-written shaders. Client-only (call from effects).
 */

export function createGL(canvas: HTMLCanvasElement, attrs?: WebGLContextAttributes): WebGLRenderingContext | null {
  try {
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
      ...attrs,
    }) as WebGLRenderingContext | null
    return gl
  } catch {
    return null
  }
}

function withLineNumbers(src: string) {
  return src
    .split("\n")
    .map((l, i) => `${String(i + 1).padStart(3, " ")}: ${l}`)
    .join("\n")
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)
  if (!sh) throw new Error("createShader failed")
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(sh)
    gl.deleteShader(sh)
    throw new Error(`Shader compile error:\n${log}\n${withLineNumbers(src)}`)
  }
  return sh
}

/** Compile + link. Throws with a line-numbered log on failure. */
export function compileProgram(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram {
  const prog = gl.createProgram()
  if (!prog) throw new Error("createProgram failed")
  const v = compileShader(gl, gl.VERTEX_SHADER, vs)
  const f = compileShader(gl, gl.FRAGMENT_SHADER, fs)
  gl.attachShader(prog, v)
  gl.attachShader(prog, f)
  gl.linkProgram(prog)
  gl.deleteShader(v)
  gl.deleteShader(f)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS) && !gl.isContextLost()) {
    const log = gl.getProgramInfoLog(prog)
    gl.deleteProgram(prog)
    throw new Error(`Program link error:\n${log}`)
  }
  return prog
}

/** Cached uniform setters for one program. Unknown names are ignored silently. */
export function uniformSetter(gl: WebGLRenderingContext, prog: WebGLProgram) {
  const cache = new Map<string, WebGLUniformLocation | null>()
  const loc = (name: string) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name))
    return cache.get(name)!
  }
  return {
    f1(name: string, v: number) {
      const l = loc(name)
      if (l) gl.uniform1f(l, v)
    },
    f2(name: string, a: number, b: number) {
      const l = loc(name)
      if (l) gl.uniform2f(l, a, b)
    },
    f3(name: string, a: number, b: number, c: number) {
      const l = loc(name)
      if (l) gl.uniform3f(l, a, b, c)
    },
    f4(name: string, a: number, b: number, c: number, d: number) {
      const l = loc(name)
      if (l) gl.uniform4f(l, a, b, c, d)
    },
    i1(name: string, v: number) {
      const l = loc(name)
      if (l) gl.uniform1i(l, v)
    },
  }
}

/**
 * Size the canvas backing store to its CSS box. dpr = min(devicePixelRatio, maxDpr) * scale.
 * Call from a ResizeObserver (not every frame).
 */
export function fitCanvas(
  canvas: HTMLCanvasElement,
  maxDpr = 2,
  scale = 1,
): { w: number; h: number; dpr: number; changed: boolean } {
  const dpr = Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, maxDpr) * scale
  const rect = canvas.getBoundingClientRect()
  const w = Math.max(1, Math.round(rect.width * dpr))
  const h = Math.max(1, Math.round(rect.height * dpr))
  const changed = canvas.width !== w || canvas.height !== h
  if (changed) {
    canvas.width = w
    canvas.height = h
  }
  return { w, h, dpr, changed }
}

/** Wire context loss/restore. Returns a cleanup function. */
export function onContextLoss(canvas: HTMLCanvasElement, lost: () => void, restored: () => void): () => void {
  const onLost = (e: Event) => {
    e.preventDefault()
    lost()
  }
  const onRestored = () => restored()
  canvas.addEventListener("webglcontextlost", onLost, false)
  canvas.addEventListener("webglcontextrestored", onRestored, false)
  return () => {
    canvas.removeEventListener("webglcontextlost", onLost, false)
    canvas.removeEventListener("webglcontextrestored", onRestored, false)
  }
}

/** One big triangle covering clip space. Draw with gl.drawArrays(gl.TRIANGLES, 0, 3) and FULLSCREEN_TRI. */
export const FULLSCREEN_TRI_VS = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

export const FULLSCREEN_TRI = new Float32Array([-1, -1, 3, -1, -1, 3])
