/* Ruido 3D para pintar las texturas sin costuras */
export type RGB = number[];

const PERM = (() => {
  const a = [...Array(256).keys()]; let sd = 7;
  const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return new Uint8Array([...a, ...a]);
})();

export function vnoise(x: number, y: number, z: number) {
  const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
  const fx = x - X, fy = y - Y, fz = z - Z;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const h = (i: number, j: number, k: number) => PERM[PERM[PERM[(X + i) & 255] + ((Y + j) & 255)] + ((Z + k) & 255)] / 255;
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(l(l(h(0, 0, 0), h(1, 0, 0), u), l(h(0, 1, 0), h(1, 1, 0), u), v),
           l(l(h(0, 0, 1), h(1, 0, 1), u), l(h(0, 1, 1), h(1, 1, 1), u), v), w);
}

export function fbm(x: number, y: number, z: number, o = 5) {
  let s = 0, a = .5, f = 1;
  for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f, z * f); f *= 2.03; a *= .5; }
  return s / (1 - Math.pow(.5, o));
}

export const hex = (h: string): RGB => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

export type Stops = [number, RGB][];
export const toStops = (st: [number, string][]): Stops => st.map(([t, h]) => [t, hex(h)]);

export function pal(st: Stops, t: number): RGB {
  t = Math.max(0, Math.min(1, t));
  for (let i = 1; i < st.length; i++) if (t <= st[i][0]) {
    const [t0, c0] = st[i - 1], [t1, c1] = st[i], k = (t - t0) / (t1 - t0 || 1);
    return c0.map((c, j) => c + (c1[j] - c) * k);
  }
  return st[st.length - 1][1];
}
