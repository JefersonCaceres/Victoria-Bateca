import * as THREE from 'three';
import { GC, armPos } from '../arm';
import { col, setC, setP } from '../glow-points';
import { SceneCtx, Stop } from '../types';
import { gauss, rand } from '../../utils/math';

/* Final: todos los momentos forman una sola galaxia */
export function buildGalaxy(ctx: SceneCtx, parent: THREE.Object3D, stops: Stop[]) {
  const NA = 4200, NB = 1800, P = ctx.points(NA * 3 + NB, parent);
  const inner = [col('#fff1e6'), col('#ffd0e6')], outer = ['#ffb6da', '#c39bff', '#8fb4ff', '#e9e2ff'].map(col);
  let i = 0;
  for (let k = 0; k < 3; k++) for (let m = 0; m < NA; m++, i++) {
    const t = rand(-.25, 1.58), [x, , z] = armPos(t, k * 2.094), r = Math.max(0, 150 - 95 * t), sp = 3 + 9 * r / 150;
    setP(P, i, x + gauss() * sp, gauss() * (1.2 + (1 - r / 150) * 3), z + gauss() * sp);
    setC(P, i, r < 45 ? inner[m % 2] : outer[m % 4]); P.size[i] = rand(1, 2.2); P.alpha[i] = rand(.35, .85);
  }
  for (let m = 0; m < NB; m++, i++) {
    setP(P, i, GC.x + gauss() * 18, gauss() * 6, GC.z + gauss() * 18);
    setC(P, i, inner[m % 2]); P.size[i] = rand(1.4, 2.8); P.alpha[i] = rand(.4, .9);
  }
  P.dirty('position', 'aColor', 'aSize', 'aAlpha'); P.u.uNear.value = 60;
  const mk = ctx.points(stops.length, parent);
  stops.forEach((sc, j) => { setP(mk, j, sc.x, sc.y, sc.z); setC(mk, j, col('#fff0f7')); mk.size[j] = 10; mk.alpha[j] = .7; });
  mk.dirty('position', 'aColor', 'aSize', 'aAlpha'); mk.u.uNear.value = 60;
  return { P, mk };
}
