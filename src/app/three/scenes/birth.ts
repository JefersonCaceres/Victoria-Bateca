import * as THREE from 'three';
import { col, setC } from '../glow-points';
import { SceneCtx, Stop } from '../types';
import { clamp01, gauss, rand } from '../../utils/math';

/* 1. El nacimiento de una galaxia: el polvo gira y se ordena en espiral */
export function sceneBirth(sc: Stop, ctx: SceneCtx) {
  const tilt = new THREE.Group(); tilt.rotation.x = .95; sc.group!.add(tilt);
  const spin = new THREE.Group(); tilt.add(spin);
  const n = 3500, P = ctx.points(n, spin), cloud = new Float32Array(n * 3), disc = new Float32Array(n * 3);
  const cols = ['#fff3f8', '#ffb6da', '#c39bff', '#8fb4ff'].map(col);
  for (let i = 0; i < n; i++) {
    const j = i * 3, u = rand(-1, 1), ph = rand(0, 6.283), rr = 2.6 * Math.cbrt(Math.random()), q = Math.sqrt(1 - u * u);
    cloud[j] = rr * q * Math.cos(ph); cloud[j + 1] = rr * u * .8; cloud[j + 2] = rr * q * Math.sin(ph);
    const arm = i % 3, d = Math.pow(Math.random(), .6), th = arm * 2.094 + d * 5 + gauss() * .28 * (1 - d * .5), r = d * 2.6;
    disc[j] = Math.cos(th) * r + gauss() * .06; disc[j + 1] = gauss() * .07 * (1 - d); disc[j + 2] = Math.sin(th) * r + gauss() * .06;
    setC(P, i, cols[d < .12 ? 0 : d < .4 ? 1 : d < .72 ? 2 : 3]); P.size[i] = rand(.035, .07) * (d < .12 ? 1.6 : 1); P.alpha[i] = rand(.5, 1);
  }
  P.pos.set(cloud); P.dirty('position', 'aColor', 'aSize', 'aAlpha');
  let lastE = -1;
  sc.update = (dt, lt) => {
    const m = lt < 0 ? 0 : clamp01((lt - .3) / 5.5), e = m * m * (3 - 2 * m);
    if (e !== lastE) { for (let k = 0; k < n * 3; k++) P.pos[k] = cloud[k] + (disc[k] - cloud[k]) * e; P.dirty('position'); lastE = e; }
    spin.rotation.y += dt * (.08 + .4 * e);
    P.u.uAlpha.value = ctx.p3.alpha;
  };
}
