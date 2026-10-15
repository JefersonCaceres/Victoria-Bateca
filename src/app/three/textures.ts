import * as THREE from 'three';
import { RGB, fbm, hex, pal, toStops } from './noise';

export interface PlanetDef {
  R: number;
  kind: 'gas' | 'ocean' | 'ice';
  glow: string;
  tilt: number;
  spin: number;
  stops?: [number, string][];
  turb?: number;
  freq?: number;
}
export interface Planet extends PlanetDef {
  group: THREE.Group;
  body: THREE.Mesh;
  clouds?: THREE.Mesh;
  atmo: THREE.Mesh;
  atmoU: { c: THREE.IUniform; o: THREE.IUniform };
  mats: THREE.Material[];
}
type SurfaceFn = (x: number, y: number, z: number) => RGB;

const OCEAN = toStops([[0, '#061a3f'], [.6, '#13448f'], [1, '#3d86d9']]);
const LAND = toStops([[0, '#c9b48a'], [.25, '#5f8a5a'], [.6, '#3e6b4a'], [1, '#d7d2c8']]);
const ICE = toStops([[0, '#2f3a66'], [.35, '#7d93c9'], [.7, '#cfdcf6'], [1, '#ffffff']]);

export function surface(p: PlanetDef): SurfaceFn {
  if (p.kind === 'gas') {
    const st = toStops(p.stops ?? []), turb = p.turb ?? 1, freq = p.freq ?? 1;
    return (x, y, z) => {
      const n = fbm(x * 2.5, y * 2.5, z * 2.5, 4);
      const b = .5 + .5 * Math.sin((y + (n - .5) * .25 * turb) * freq);
      return pal(st, b * .75 + fbm(x * 9, y * 30, z * 9, 3) * .3 - .05);
    };
  }
  if (p.kind === 'ocean') return (x, y, z) => {
    if (Math.abs(y) + (fbm(x * 5, y * 5, z * 5, 3) - .5) * .2 > .86) return [240, 245, 255];
    const hgt = fbm(x * 1.8 + 3, y * 1.8, z * 1.8, 6);
    return hgt < .54 ? pal(OCEAN, Math.pow(hgt / .54, 2)) : pal(LAND, (hgt - .54) / .22);
  };
  return (x, y, z) => {
    const n = fbm(x * 2.5, y * 2.5, z * 2.5, 5);
    const r = 1 - Math.abs(fbm(x * 7 + 9, y * 7, z * 7, 4) * 2 - 1);
    return pal(ICE, n * .7 + Math.pow(r, 6) * .5 - .05);
  };
}

export function sphereTexture(w: number, h: number, fn: SurfaceFn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d')!, img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) {
    const lat = (.5 - y / h) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
    for (let x = 0; x < w; x++) {
      const lon = x / w * Math.PI * 2, c4 = fn(cl * Math.cos(lon), sl, cl * Math.sin(lon)), o = (y * w + x) * 4;
      d[o] = c4[0]; d[o + 1] = c4[1]; d[o + 2] = c4[2]; d[o + 3] = c4.length > 3 ? c4[3] : 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
}

export function ringTexture(color: string) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 4;
  const g = c.getContext('2d')!, [r, gg, b] = hex(color);
  for (let x = 0; x < 512; x++) {
    const t = x / 511; let a = (.25 + .75 * fbm(t * 24, .3, .7, 4)) * Math.min(1, t * 8) * Math.min(1, (1 - t) * 6);
    if (t > .55 && t < .6) a *= .15;
    g.fillStyle = `rgba(${r},${gg},${b},${a.toFixed(3)})`; g.fillRect(x, 0, 1, 4);
  }
  const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding; return tx;
}

export function atmoMat(color: string) {
  const u = { c: { value: new THREE.Color(color) }, o: { value: 1 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 c; uniform float o; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), 2.2); gl_FragColor = vec4(c * f * 1.4, f * o); }',
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
  return { mat, u };
}

export function buildPlanet(def: PlanetDef, parent: THREE.Object3D, sphere: THREE.SphereGeometry): Planet {
  const group = new THREE.Group(), tg = new THREE.Group(); tg.rotation.z = def.tilt; group.add(tg);
  const mats: THREE.Material[] = [];
  const body = new THREE.Mesh(sphere, new THREE.MeshStandardMaterial({
    map: sphereTexture(512, 256, surface(def)), roughness: def.kind === 'ocean' ? .55 : .85, metalness: 0, transparent: true }));
  tg.add(body); mats.push(body.material as THREE.Material);
  let clouds: THREE.Mesh | undefined;
  if (def.kind === 'ocean') {
    clouds = new THREE.Mesh(sphere, new THREE.MeshStandardMaterial({ roughness: 1, transparent: true, depthWrite: false,
      map: sphereTexture(512, 256, (x, y, z) => { const n = fbm(x * 3 + 7, y * 3, z * 3, 5);
        return [255, 255, 255, Math.max(0, Math.min(1, (n - .52) / .18)) * 230]; }) }));
    clouds.scale.setScalar(1.015); tg.add(clouds); mats.push(clouds.material as THREE.Material);
  }
  const { mat, u } = atmoMat(def.glow);
  const atmo = new THREE.Mesh(sphere, mat); atmo.scale.setScalar(1.09); group.add(atmo);
  parent.add(group);
  return { ...def, group, body, clouds, atmo, atmoU: u, mats };
}
