import * as THREE from 'three';
import { easeOutCubic, rand } from '../utils/math';

/* ---------- Nombre en estrellas 3D ---------- */
const NAME_VS = 'attribute float aSize; attribute float aSeed; uniform float uScale; uniform float uTime; varying float vTw;' +
  'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uScale / -mv.z;' +
  ' gl_Position = projectionMatrix * mv; vTw = 0.7 + 0.3 * sin(uTime * (1.5 + aSeed * 2.0) + aSeed * 30.0); }';
const NAME_FS = 'uniform float uAlpha; varying float vTw;' +
  'void main(){ float d = length(gl_PointCoord - 0.5); float core = smoothstep(0.2, 0.0, d); float glow = smoothstep(0.5, 0.0, d) * 0.4;' +
  ' float a = (core + glow) * uAlpha * vTw; if (a < 0.01) discard;' +
  ' gl_FragColor = vec4(mix(vec3(1.0, 0.7, 0.86), vec3(1.0, 0.98, 1.0), core), a); }';

export interface Screen { W: number; H: number; cx: number; }

function nameTargets(text: string, { W, H, cx }: Screen) {
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const o = off.getContext('2d')!, font = (s: number) => `700 ${s}px "Dancing Script", cursive`;
  let size = Math.min(H * .2, 160); o.font = font(size);
  const w = o.measureText(text).width;
  if (w > W * .86) { size *= (W * .86) / w; o.font = font(size); }
  o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle';
  o.fillText(text, cx, H * .4);
  const data = o.getImageData(0, 0, W, H).data;
  let step = 2, pts: [number, number][];
  do {
    pts = [];
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step)
      if (data[(y * W + x) * 4 + 3] > 150) pts.push([x, y]);
    step++;
  } while (pts.length > 3200);
  return pts;
}

export class NameStars {
  alpha = 0;
  mode: 'off' | 'idle' | 'form' | 'explode' = 'off';
  obj: THREE.Points | null = null;
  private n = 0;
  private from = new Float32Array(0); private to = new Float32Array(0); private vel = new Float32Array(0);
  private delay = new Float32Array(0); private dur = new Float32Array(0); private base = new Float32Array(0);
  private pos = new Float32Array(0); private size = new Float32Array(0);
  private px: number[] = []; private minX = 0; private maxX = 0;
  private geo: THREE.BufferGeometry | null = null;
  private readonly u = { uScale: { value: 1 }, uTime: { value: 0 }, uAlpha: { value: 0 } };

  constructor(private readonly parent: THREE.Object3D) {}

  /** Riega las estrellas en profundidad. `camZ` es la distancia de la cámara al plano del nombre. */
  start(text: string, screen: Screen, camZ: number) {
    const { H, cx } = screen;
    const pts = nameTargets(text, screen), n = pts.length;
    const k = 2 * camZ * Math.tan(Math.PI / 8) / H;
    const pos = new Float32Array(n * 3), size = new Float32Array(n), seed = new Float32Array(n);
    this.n = n; this.pos = pos; this.size = size;
    this.from = new Float32Array(n * 3); this.to = new Float32Array(n * 3); this.vel = new Float32Array(n * 3);
    this.delay = new Float32Array(n).fill(1e9); this.dur = new Float32Array(n); this.base = new Float32Array(n);
    this.px = pts.map(q => q[0]);
    this.minX = Math.min(...this.px); this.maxX = Math.max(...this.px);
    pts.forEach(([x, y], i) => {
      const j = i * 3;
      this.to[j] = (x - cx) * k; this.to[j + 1] = -(y - H * .4) * k; this.to[j + 2] = rand(-.3, .3);
      this.from[j] = rand(-14, 14); this.from[j + 1] = rand(-16, 16); this.from[j + 2] = rand(-50, 6);
      pos[j] = this.from[j]; pos[j + 1] = this.from[j + 1]; pos[j + 2] = this.from[j + 2];
      this.base[i] = size[i] = rand(.07, .12); seed[i] = Math.random();
    });
    const geo = this.geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const mat = new THREE.ShaderMaterial({ uniforms: { ...this.u },
      vertexShader: NAME_VS, fragmentShader: NAME_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.obj = new THREE.Points(geo, mat); this.obj.frustumCulled = false; this.parent.add(this.obj);
    this.mode = 'idle';
  }

  /** Las estrellas viajan desde el fondo hasta su letra, de izquierda a derecha. Devuelve cuánto tarda (s). */
  form(time: number) {
    const span = 5.2;
    for (let i = 0; i < this.n; i++) {
      this.delay[i] = time + .2 + (this.px[i] - this.minX) / (this.maxX - this.minX || 1) * span + rand(0, .6);
      this.dur[i] = rand(2, 2.8);
    }
    this.mode = 'form';
    return .2 + span + .6 + 2.8;
  }

  explode() {
    const p = this.pos;
    for (let i = 0; i < this.n; i++) {
      const j = i * 3;
      this.vel[j] = p[j] * rand(.3, 1.2) + rand(-1, 1); this.vel[j + 1] = p[j + 1] * rand(.3, 1.2) + rand(-1, 1); this.vel[j + 2] = rand(4, 16);
    }
    this.mode = 'explode';
  }

  update(dt: number, time: number, uScale: number) {
    const obj = this.obj, geo = this.geo;
    if (!obj || !geo) return;
    obj.visible = this.alpha > .01; if (!obj.visible) return;
    const p = this.pos, sz = this.size;
    for (let i = 0; i < this.n; i++) {
      const j = i * 3;
      if (this.mode === 'explode') {
        p[j] += this.vel[j] * dt; p[j + 1] += this.vel[j + 1] * dt; p[j + 2] += this.vel[j + 2] * dt;
        this.vel[j + 2] *= 1 + dt * 1.5; continue;
      }
      const t = (time - this.delay[i]) / (this.dur[i] || 1);
      if (t <= 0) {
        p[j] = this.from[j] + Math.sin(time * .6 + i) * .15; p[j + 1] = this.from[j + 1] + Math.cos(time * .5 + i) * .15; p[j + 2] = this.from[j + 2];
        sz[i] = this.base[i];
      } else {
        const e = t >= 1 ? 1 : easeOutCubic(t);
        for (let a = 0; a < 3; a++) p[j + a] = this.from[j + a] + (this.to[j + a] - this.from[j + a]) * e;
        const fly = t < 1 ? Math.sin(Math.PI * t) : 0, spark = t > 1 && t < 1.5 ? 1 - (t - 1) / .5 : 0;
        sz[i] = this.base[i] * (1 + .8 * fly + 2.2 * spark);
      }
    }
    (geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (geo.getAttribute('aSize') as THREE.BufferAttribute).needsUpdate = true;
    obj.rotation.y = Math.sin(time * .35) * .22; obj.rotation.x = Math.sin(time * .23) * .07;
    this.u.uAlpha.value = this.alpha; this.u.uTime.value = time; this.u.uScale.value = uScale;
  }
}
