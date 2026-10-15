import * as THREE from 'three';
import { V3, col, setC, setP, trailSetup, trailUpdate } from '../glow-points';
import { SceneCtx, Stop } from '../types';
import { clamp01 } from '../../utils/math';

/* 4. Dos estrellas, una órbita: giran juntas unidas por un hilo de luz */
export function sceneOrbit(sc: Stop, ctx: SceneCtx) {
  const tilt = new THREE.Group(); tilt.rotation.x = .5; sc.group!.add(tilt);
  const pink = col('#ffb3d6'), blue = col('#bcd4ff'), geo = new THREE.SphereGeometry(.3, 32, 24);
  const matA = new THREE.MeshBasicMaterial({ color: 0xffd0e4, transparent: true });
  const matB = new THREE.MeshBasicMaterial({ color: 0xd8e6ff, transparent: true });
  const sA = new THREE.Mesh(geo, matA), sB = new THREE.Mesh(geo, matB);
  tilt.add(sA, sB);
  const halo = ctx.points(4, tilt);
  ([[0, pink, 1.6, .6], [1, blue, 1.6, .6], [2, pink, 3.6, .22], [3, blue, 3.6, .22]] as const).forEach(([i, c, z, a]) => { setC(halo, i, c); halo.size[i] = z; halo.alpha[i] = a; });
  halo.dirty('aColor', 'aSize', 'aAlpha');
  const NT = 40, thread = ctx.points(NT, tilt);
  for (let i = 0; i < NT; i++) { setC(thread, i, pink.clone().lerp(blue, i / (NT - 1))); thread.size[i] = .07; thread.alpha[i] = 0; }
  thread.dirty('aColor', 'aSize', 'aAlpha');
  const TR = 80, trail = ctx.points(TR * 2, tilt), hist: V3[][] = [[], []]; let acc = 0, ang = 0;
  trailSetup(trail, TR, [pink, blue]);
  sc.update = (dt, lt) => {
    const time = ctx.time;
    ang += dt * .9;
    const R = 1.3, A: V3 = [Math.cos(ang) * R, 0, Math.sin(ang) * R], B: V3 = [-A[0], 0, -A[2]];
    sA.position.set(...A); sB.position.set(...B); matA.opacity = matB.opacity = ctx.p3.alpha;
    setP(halo, 0, ...A); setP(halo, 2, ...A); setP(halo, 1, ...B); setP(halo, 3, ...B); halo.dirty('position');
    const th = lt < 0 ? 0 : clamp01((lt - .8) / 1.6);
    for (let i = 0; i < NT; i++) {
      const u = (i + .5) / NT, w = Math.sin(u * Math.PI) * .1 * Math.sin(time * 3 + u * 9);
      setP(thread, i, A[0] + (B[0] - A[0]) * u, w, A[2] + (B[2] - A[2]) * u); thread.alpha[i] = th * (.55 + .45 * Math.sin(u * Math.PI));
    }
    thread.dirty('position', 'aAlpha');
    acc += dt; trailUpdate(trail, TR, hist, A, B, acc > .04, .45); if (acc > .04) acc = 0;
    for (const P of [halo, thread, trail]) P.u.uAlpha.value = ctx.p3.alpha;
  };
}
