import * as THREE from 'three';
import { Glow } from './glow-points';
import { Planet } from './textures';

/** Una de las cinco paradas del viaje. */
export interface Stop {
  x: number; y: number; z: number;
  /** Radio visual de la escena (define a qué distancia se para la cámara). */
  r: number;
  /** Momento en que la cámara llegó (null si aún no llega). */
  t0: number | null;
  group: THREE.Group | null;
  planet?: Planet;
  update: (dt: number, lt: number) => void;
}

/** Lo que cada escena necesita del motor 3D. */
export interface SceneCtx {
  readonly time: number;
  readonly p3: { alpha: number };
  readonly sphere: THREE.SphereGeometry;
  points(n: number, parent: THREE.Object3D): Glow;
  pulseFlash(v: number): void;
}
