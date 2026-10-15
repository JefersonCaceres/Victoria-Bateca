import * as THREE from 'three';
import { V3, col, setC, setP } from '../glow-points';
import { SceneCtx, Stop } from '../types';
import { clamp01, easeOutBack, gauss, rand } from '../../utils/math';

/* 3. Nuestra primera estrella: las dos luces se tocan y se enciende una estrella */
export function sceneStar(sc: Stop, ctx: SceneCtx) {
  const g = sc.group!, pink = col('#ff9ccc'), blue = col('#9cc4ff');
  const orbs = ctx.points(4, g);
  ([[0, pink, .5, 1], [1, blue, .5, 1], [2, pink, 1.7, .35], [3, blue, 1.7, .35]] as const).forEach(([i, c, z, a]) => { setC(orbs, i, c); orbs.size[i] = z; orbs.alpha[i] = a; });
  orbs.dirty('aColor', 'aSize', 'aAlpha');
  const starMat = new THREE.MeshBasicMaterial({ color: 0xfff4e0, transparent: true });
  const star = new THREE.Mesh(new THREE.SphereGeometry(.8, 48, 32), starMat);
  star.scale.setScalar(.001); g.add(star);
  const halo = ctx.points(3, g), hb = [.6, .3, .14];
  ([[col('#ffd9a8'), 3.4], [col('#ff9fd0'), 6], [col('#b49cff'), 10]] as const).forEach(([c, z], i) => { setC(halo, i, c); halo.size[i] = z; halo.alpha[i] = 0; });
  halo.dirty('aColor', 'aSize', 'aAlpha');
  const NW = 500, wave = ctx.points(NW, g), dir: V3[] = [];
  for (let i = 0; i < NW; i++) {
    const a = rand(0, 6.283); dir.push([Math.cos(a), Math.sin(a) * .8, gauss() * .25]);
    setC(wave, i, col(Math.random() < .5 ? '#ffe2b8' : '#ffc4e2')); wave.size[i] = rand(.05, .11); wave.alpha[i] = 0;
  }
  wave.dirty('aColor', 'aSize', 'aAlpha');
  const IG = 1.5; let lit = false;
  sc.update = (dt, lt) => {
    const time = ctx.time;
    const m = lt < 0 ? 0 : clamp01(lt / IG), sep = .75 * (1 - m * m), wob = Math.sin(time * 1.3) * .08 * (1 - m);
    setP(orbs, 0, -sep, wob, 0); setP(orbs, 2, -sep, wob, 0); setP(orbs, 1, sep, -wob, 0); setP(orbs, 3, sep, -wob, 0); orbs.dirty('position');
    const ig = lt < IG ? 0 : clamp01((lt - IG) / 1.1);
    if (lt >= IG && !lit) { lit = true; ctx.pulseFlash(.65); }
    orbs.u.uAlpha.value = ctx.p3.alpha * (1 - ig);
    star.scale.setScalar(ig > 0 ? Math.max(.001, easeOutBack(ig)) * (1 + .03 * Math.sin(time * 3)) : .001);
    starMat.opacity = ctx.p3.alpha;
    for (let i = 0; i < 3; i++) halo.alpha[i] = hb[i] * ig * (.9 + .1 * Math.sin(time * 2 + i));
    halo.dirty('aAlpha'); halo.u.uAlpha.value = ctx.p3.alpha;
    const wl = lt - IG, rr = .8 + Math.max(0, wl) * 2.4;
    for (let i = 0; i < NW; i++) { setP(wave, i, dir[i][0] * rr, dir[i][1] * rr, dir[i][2] * rr); wave.alpha[i] = wl > 0 && wl < 3 ? (1 - wl / 3) * .8 : 0; }
    wave.dirty('position', 'aAlpha'); wave.u.uAlpha.value = ctx.p3.alpha;
  };
}
