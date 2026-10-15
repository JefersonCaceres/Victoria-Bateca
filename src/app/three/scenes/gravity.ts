import { V3, col, setC, setP, trailSetup, trailUpdate } from '../glow-points';
import { SceneCtx, Stop } from '../types';
import { clamp01, gauss, rand } from '../../utils/math';

/* 2. La fuerza de gravedad: dos luces se atraen y el polvo cae hacia ellas */
export function sceneGravity(sc: Stop, ctx: SceneCtx) {
  const g = sc.group!, pink = col('#ff9ccc'), blue = col('#9cc4ff');
  const orbs = ctx.points(4, g);
  ([[0, pink, .5, 1], [1, blue, .5, 1], [2, pink, 1.7, .35], [3, blue, 1.7, .35]] as const).forEach(([i, c, z, a]) => { setC(orbs, i, c); orbs.size[i] = z; orbs.alpha[i] = a; });
  orbs.dirty('aColor', 'aSize', 'aAlpha');
  const TR = 50, trail = ctx.points(TR * 2, g), hist: V3[][] = [[], []]; let acc = 0;
  trailSetup(trail, TR, [pink, blue]);
  const ND = 700, dust = ctx.points(ND, g), dd: { r: number; a: number; y: number }[] = [];
  for (let i = 0; i < ND; i++) {
    dd.push({ r: rand(.4, 4.2), a: rand(0, 6.283), y: gauss() * .2 });
    setC(dust, i, col(Math.random() < .5 ? '#ffd6ea' : '#d6e2ff')); dust.size[i] = rand(.025, .05); dust.alpha[i] = rand(.3, .8);
  }
  dust.dirty('aColor', 'aSize', 'aAlpha');
  sc.update = (dt, lt) => {
    const k = lt < 0 ? 0 : clamp01(lt / 7), e = 1 - Math.pow(1 - k, 2);
    const sep = 2.6 - 1.85 * e, wob = Math.sin(ctx.time * 1.3) * .1;
    const A: V3 = [-sep, .35 * (1 - e) + wob, 0], B: V3 = [sep, -.35 * (1 - e) - wob, 0];
    setP(orbs, 0, ...A); setP(orbs, 2, ...A); setP(orbs, 1, ...B); setP(orbs, 3, ...B); orbs.dirty('position');
    acc += dt; trailUpdate(trail, TR, hist, A, B, acc > .05, .5); if (acc > .05) acc = 0;
    for (let i = 0; i < ND; i++) {
      const d = dd[i]; d.r -= dt * (.12 + .25 / d.r); d.a += dt * (.35 / d.r);
      if (d.r < .35) { d.r = rand(3.6, 4.2); d.a = rand(0, 6.283); }
      setP(dust, i, Math.cos(d.a) * d.r, Math.sin(d.a) * d.r * .45 + d.y, Math.sin(d.a) * d.r * .3);
    }
    dust.dirty('position');
    for (const P of [orbs, trail, dust]) P.u.uAlpha.value = ctx.p3.alpha;
  };
}
