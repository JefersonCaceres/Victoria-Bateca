import * as THREE from 'three';

/* Puntos de luz (estrellas, polvo, estelas) */
export type V3 = [number, number, number];
export type GlowAttr = 'position' | 'aSize' | 'aColor' | 'aAlpha' | 'aSeed';

export interface GlowUniforms {
  uScale: THREE.IUniform<number>;
  uTime: THREE.IUniform<number>;
  uAlpha: THREE.IUniform<number>;
  uNear: THREE.IUniform<number>;
}
export interface Glow {
  n: number;
  geo: THREE.BufferGeometry;
  pos: Float32Array;
  size: Float32Array;
  col: Float32Array;
  alpha: Float32Array;
  seed: Float32Array;
  mat: THREE.ShaderMaterial;
  u: GlowUniforms;
  obj: THREE.Points;
  dirty(...keys: GlowAttr[]): void;
}

const GLOW_VS = 'attribute float aSize; attribute float aSeed; attribute vec3 aColor; attribute float aAlpha;' +
  'uniform float uScale; uniform float uTime; uniform float uNear; varying vec3 vC; varying float vA;' +
  'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(aSize * uScale / -mv.z, 300.0);' +
  ' gl_Position = projectionMatrix * mv; vC = aColor;' +
  ' vA = aAlpha * (0.78 + 0.22 * sin(uTime * (1.5 + aSeed * 2.0) + aSeed * 30.0));' +
  ' if (uNear > 0.0) vA *= smoothstep(uNear * 0.25, uNear, -mv.z); }';
const GLOW_FS = 'uniform float uAlpha; varying vec3 vC; varying float vA;' +
  'void main(){ float d = length(gl_PointCoord - 0.5); float core = smoothstep(0.2, 0.0, d); float glow = smoothstep(0.5, 0.0, d) * 0.45;' +
  ' float a = (core + glow) * uAlpha * vA; if (a < 0.004) discard; gl_FragColor = vec4(mix(vC, vec3(1.0), core * 0.6), a); }';

/** Crea una nube de puntos de luz; su material queda en `registry` para actualizar escala y tiempo cada frame. */
export function makePoints(n: number, parent: THREE.Object3D, registry: GlowUniforms[]): Glow {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), size = new Float32Array(n).fill(.08), col = new Float32Array(n * 3).fill(1),
    alpha = new Float32Array(n).fill(1), seed = Float32Array.from({ length: n }, () => Math.random());
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const u: GlowUniforms = { uScale: { value: 1 }, uTime: { value: 0 }, uAlpha: { value: 1 }, uNear: { value: 0 } };
  const mat = new THREE.ShaderMaterial({ uniforms: { ...u },
    vertexShader: GLOW_VS, fragmentShader: GLOW_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  registry.push(u);
  const obj = new THREE.Points(geo, mat); obj.frustumCulled = false; parent.add(obj);
  const dirty = (...keys: GlowAttr[]) => keys.forEach(k => { (geo.getAttribute(k) as THREE.BufferAttribute).needsUpdate = true; });
  return { n, geo, pos, size, col, alpha, seed, mat, u, obj, dirty };
}

export const col = (h: string) => new THREE.Color(h);
export function setP(P: Glow, i: number, x: number, y: number, z: number) { P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z; }
export function setC(P: Glow, i: number, c: THREE.Color) { P.col[i * 3] = c.r; P.col[i * 3 + 1] = c.g; P.col[i * 3 + 2] = c.b; }

export function trailSetup(P: Glow, TR: number, colors: THREE.Color[]) {
  for (let i = 0; i < TR * 2; i++) { setC(P, i, colors[i < TR ? 0 : 1]); P.size[i] = .2 * (1 - (i % TR) / TR); P.alpha[i] = 0; }
  P.dirty('aColor', 'aSize', 'aAlpha');
}
export function trailUpdate(P: Glow, TR: number, hist: V3[][], A: V3, B: V3, push: boolean, peak: number) {
  if (push) { hist[0].unshift(A); hist[1].unshift(B); if (hist[0].length > TR) { hist[0].length = TR; hist[1].length = TR; } }
  for (let k = 0; k < 2; k++) for (let i = 0; i < hist[k].length; i++) {
    const idx = k * TR + i; setP(P, idx, ...hist[k][i]); P.alpha[idx] = peak * (1 - i / TR);
  }
  P.dirty('position', 'aAlpha');
}
