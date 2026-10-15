import * as THREE from 'three';
import { V3, col, setC, setP } from '../glow-points';
import { buildPlanet } from '../textures';
import { SceneCtx, Stop } from '../types';
import { clamp01, gauss, rand } from '../../utils/math';

/* 5. Nuestro hogar: un planeta iluminado por las dos estrellas, con una luz encendida */
export function sceneHome(sc: Stop, ctx: SceneCtx) {
  const p = buildPlanet({ R: 60, kind: 'ocean', glow: '#7fb2ff', tilt: .4, spin: .07 }, sc.group!, ctx.sphere);
  sc.planet = p;
  const suns = ctx.points(4, sc.group!);
  ([[0, '#ffb3d6', [-1.9, 2.7, -6], .9, 1], [1, '#bcd4ff', [-.9, 3.1, -7], .9, 1],
    [2, '#ff9fd0', [-1.9, 2.7, -6], 2.8, .3], [3, '#a9c6ff', [-.9, 3.1, -7], 2.8, .3]] as [number, string, V3, number, number][]).forEach(([i, c, q, z, a]) => {
    setC(suns, i, col(c)); setP(suns, i, ...q); suns.size[i] = z; suns.alpha[i] = a; });
  suns.dirty('position', 'aColor', 'aSize', 'aAlpha');
  const nrm = new THREE.Vector3(.75, -.45, .48).normalize(), home = ctx.points(8, p.group), warm = col('#ffcf7a');
  for (let i = 0; i < 8; i++) {
    const v = nrm.clone();
    if (i > 0 && i < 7) v.add(new THREE.Vector3(gauss() * .035, gauss() * .035, gauss() * .035)).normalize();
    v.multiplyScalar(1.012); setP(home, i, v.x, v.y, v.z); setC(home, i, warm);
    home.size[i] = i === 0 ? .16 : i === 7 ? .55 : rand(.04, .07); home.alpha[i] = i === 7 ? .35 : .9;
  }
  home.dirty('position', 'aColor', 'aSize', 'aAlpha'); home.mat.depthTest = false;
  sc.update = (dt, lt) => {
    p.body.rotation.y += dt * p.spin * .35; p.clouds!.rotation.y += dt * p.spin * .5;
    for (const m of p.mats) m.opacity = ctx.p3.alpha;
    p.atmoU.o.value = ctx.p3.alpha; suns.u.uAlpha.value = ctx.p3.alpha;
    const on = lt < 0 ? 0 : clamp01((lt - 1.8) / 1.4);
    home.u.uAlpha.value = ctx.p3.alpha * on * (.88 + .12 * Math.sin(ctx.time * 2.2));
  };
}
