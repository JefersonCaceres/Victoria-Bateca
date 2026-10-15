import { V3 } from './glow-points';

/* Las cinco paradas van sobre un brazo de la galaxia final */
export const GC = { x: 30, z: -170 };

export function armPos(t: number, off = 0): V3 {
  const th = Math.PI * .55 + t * Math.PI * .95 + off, r = 150 - 95 * t;
  return [GC.x + r * Math.cos(th), 0, GC.z + r * Math.sin(th)];
}
