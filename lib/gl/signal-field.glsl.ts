/**
 * SignalField shaders (W3). Raw WebGL1 / GLSL ES 1.0.
 *
 * Coordinates: every uniform in PIXELS of the backing store (dpr applied), y pointing DOWN
 * (0 = canvas top), so JS can pass DOM measurements straight through.
 *
 * Pass 1 — STREAK: an anamorphic flare on the horizon row, drawn on a band quad
 *   y ∈ [fy − 0.22·H, fy + 0.22·H] so fragment cost is limited to that band. Additive.
 * Pass 2 — TRACES: L lines × S segments as one indexed triangle strip-list; each vertex carries
 *   (aLine 0..1, aT 0..1, aSide ±1) and is displaced in the vertex shader. Additive.
 *
 * Presets: uPreset 0 = "hero" (noisy field, blade calm, pointer lens + bow, converge/collapse)
 *          uPreset 1 = "horizon" (W9 finale: calm sine lines in the lower 55%, unfold from the top seam)
 */
import { HASH12, SIMPLEX3 } from "./noise.glsl"

const PRECISION = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`

/* ------------------------------------------------------------------ pass 1: streak */

export const STREAK_VS = /* glsl */ `
precision highp float;
attribute vec2 aPos;          // unit quad, x,y ∈ [-1, 1]
uniform vec2 uRes;            // backing-store px
uniform float uFlareY;        // px, y-down
void main() {
  float yPx = uFlareY + aPos.y * 0.22 * uRes.y;
  gl_Position = vec4(aPos.x, 1.0 - 2.0 * yPx / uRes.y, 0.0, 1.0);
}
`

export const STREAK_FS = /* glsl */ `
${PRECISION}
uniform vec2 uRes;
uniform vec2 uFlare;          // px, y-down
uniform float uK;             // vertical tightness (180 at rest)
uniform float uIntensity;
uniform float uTime;          // s
uniform float uDpr;
uniform float uWarm;          // 0 hero, 1 horizon (core tinted 10% toward violet)
${HASH12}
void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 p = px - uFlare;
  float dx = abs(p.x) / uRes.x;
  float fr = 1.5 * uDpr;                                   // ±1.5px chromatic fringe
  float ex = exp(-dx * 1.1);
  float cR = exp(-abs(p.y + fr) / uRes.y * uK) * ex;
  float cG = exp(-abs(p.y) / uRes.y * uK) * ex;
  float cB = exp(-abs(p.y - fr) / uRes.y * uK) * ex;
  float dy = abs(p.y) / uRes.y;
  float halo = exp(-dy * uK * 0.12) * exp(-dx * 0.55) * 0.28;
  // small hot bloom where the flare sits
  float bloom = exp(-length(vec2(p.x / uRes.x * 0.35, p.y / uRes.y)) * 38.0) * 0.22;

  vec3 coreCol = mix(vec3(0.486, 0.957, 1.0), vec3(0.545, 0.361, 0.965), 0.1 * uWarm);
  vec3 haloCol = vec3(0.545, 0.361, 0.965);
  vec3 col = vec3(coreCol.r * cR, coreCol.g * cG, coreCol.b * cB) + haloCol * halo + vec3(0.78, 0.98, 1.0) * bloom;
  col *= uIntensity;
  // in-shader grain, confined to where there is light (additive can't darken)
  float lum = max(col.r, max(col.g, col.b));
  col += (hash12(gl_FragCoord.xy + floor(uTime * 24.0)) - 0.5) * 0.035 * clamp(lum * 4.0, 0.0, 1.0);
  col = max(col, 0.0);
  gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)));
}
`

/* ------------------------------------------------------------------ pass 2: traces */

export const TRACE_VS = /* glsl */ `
precision highp float;
attribute vec3 aData;         // x = aLine (0..1), y = aT (0..1), z = aSide (±1)
uniform vec2 uRes;
uniform float uDpr;
uniform float uPreset;        // 0 hero, 1 horizon
uniform float uL;             // line count
uniform float uS;             // segments per line
uniform float uSpread;        // px (0.84·H for hero)
uniform float uHorizon;       // px, y-down
uniform float uSeam;          // px, y-down (canvas bottom)
uniform float uAmp;
uniform float uTime;          // s
uniform float uCut;           // 0..1.05 in canvas x
uniform float uConverge;
uniform float uCollapse;
uniform float uMid;           // aLine of the line that survives convergence
uniform vec3 uPointer;        // xy px (y-down), z = lens strength 0..1
varying float vSide;
varying float vCalm;
varying float vLens;
varying float vLine;
varying float vMid;
varying float vDepth;

${SIMPLEX3}

float calmCutAt(float x) {
  return mix(0.2, 1.0, smoothstep(uCut - 0.03, uCut + 0.01, x));
}

// returns (y px, calmCut, lens)
vec3 traceAt(float x01, float line) {
  float W = uRes.x;
  float H = uRes.y;
  float sig = 170.0 * uDpr;
  if (uPreset < 0.5) {
    // amplitude scale: the line pitch, capped so sparse (mobile) fields don't over-shake
    float spacing = min(uSpread / uL, 16.0 * uDpr);
    float y0 = uHorizon + (line - 0.5) * uSpread;
    float lag = 0.25 * abs(line - 0.5) * 2.0;
    float conv = clamp((uConverge - lag) / 0.75, 0.0, 1.0);
    float yTarget = mix(uHorizon, uSeam, uCollapse);
    float yBase = mix(y0, yTarget, conv);
    float cc = calmCutAt(x01);
    vec2 d = vec2(x01 * W, yBase) - uPointer.xy;
    float lens = exp(-dot(d, d) / (2.0 * sig * sig)) * uPointer.z;
    float env = smoothstep(0.0, 0.12, x01) * smoothstep(1.0, 0.88, x01);
    float amp = uAmp * spacing * 0.9 * (1.0 - conv) * env * cc * (1.0 - 0.85 * lens);
    float n = snoise(vec3(x01 * 2.4 + uTime * 0.05, line * 7.3, uTime * 0.12));
    // a finer, faster octave so the untreated traces read as noisy telemetry, not waves
    n += 0.45 * snoise(vec3(x01 * 11.0 - uTime * 0.23, line * 13.1 + 4.0, uTime * 0.31)) * (cc - 0.2) * 1.25;
    float bow = sign(yBase - uPointer.y) * lens * 6.0 * uDpr * (1.0 - conv);
    return vec3(yBase + amp * n + bow, cc, lens);
  }
  // horizon: calm sine lines across the lower 55%, unfolding down from the top seam
  float y0 = H * (0.45 + 0.55 * line);
  float u = clamp(((1.0 - uCollapse) - 0.3 * line) / 0.7, 0.0, 1.0);
  u = u < 0.5 ? 16.0 * u * u * u * u * u : 1.0 - pow(-2.0 * u + 2.0, 5.0) / 2.0;   // quint in-out
  float yBase = mix(1.5 * uDpr, y0, u);                 // collapsed = on the top seam, fully visible
  vec2 d = vec2(x01 * W, yBase) - uPointer.xy;
  float lens = exp(-dot(d, d) / (2.0 * sig * sig)) * uPointer.z;
  float y = yBase + 4.0 * uDpr * u * sin(x01 * 6.283 + uTime * 0.4 + line * 3.0);
  return vec3(y, 0.2, lens);
}

void main() {
  float line = aData.x;
  float x01 = aData.y;
  float e = 1.0 / uS;
  vec3 c = traceAt(x01, line);
  float ya = traceAt(x01 - e, line).x;
  float yb = traceAt(x01 + e, line).x;
  vec2 tangent = vec2(2.0 * e * uRes.x, yb - ya);
  vec2 nrm = normalize(vec2(-tangent.y, tangent.x));
  vec2 px = vec2(x01 * uRes.x, c.x) + nrm * aData.z * 4.0 * uDpr;
  gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - 2.0 * px.y / uRes.y, 0.0, 1.0);

  vSide = aData.z;
  vCalm = (1.0 - c.y) / 0.8;
  vLens = c.z;
  vLine = line;
  vMid = step(abs(line - uMid), 0.5 / max(1.0, uL - 1.0));
  vDepth = abs(line - 0.5) * 2.0;
}
`

export const TRACE_FS = /* glsl */ `
${PRECISION}
uniform vec2 uRes;
uniform float uDpr;
uniform float uPreset;
uniform float uConverge;
uniform float uCollapse;
uniform float uGain;          // global alpha multiplier (ignite / exit)
uniform vec4 uAvoid;          // px rect (x, y, w, h), y-down; w = 0 disables
uniform vec3 uMute;
uniform vec3 uViolet;
uniform vec3 uSignal;
varying float vSide;
varying float vCalm;
varying float vLens;
varying float vLine;
varying float vMid;
varying float vDepth;

float avoidMask(vec2 p) {
  if (uAvoid.z <= 0.0) return 0.0;
  vec2 half_ = uAvoid.zw * 0.5;
  vec2 c = uAvoid.xy + half_;
  float r = 24.0 * uDpr;
  vec2 q = abs(p - c) - half_ + r;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  return 1.0 - smoothstep(0.0, 24.0 * uDpr, d);
}

void main() {
  float s = abs(vSide);
  float core = 1.0 - smoothstep(0.75 / 4.0, 1.5 / 4.0, s);
  float halo = exp(-s * 3.0) * 0.25;
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float lens = vLens;
  vec3 col;
  float alpha;
  if (uPreset < 0.5) {
    col = mix(mix(uMute, uViolet, vLine * 0.5), uSignal, clamp(vCalm + lens, 0.0, 1.0));
    alpha = mix(0.28, 0.22, vCalm) + 0.5 * lens;
    alpha *= mix(1.0, 0.22, pow(vDepth, 1.5));                 // depth: outer rows recede
    alpha = mix(alpha, vMid, smoothstep(0.7, 1.0, uConverge));  // only the centre line survives
  } else {
    col = uSignal;
    alpha = (0.18 + 0.5 * lens) * mix(1.0, 0.35, uCollapse);
  }
  alpha *= 1.0 - 0.55 * avoidMask(p);
  alpha *= uGain;
  vec3 rgb = col * (core + halo) * alpha;
  gl_FragColor = vec4(rgb, max(rgb.r, max(rgb.g, rgb.b)));
}
`
