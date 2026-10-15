import { Injectable } from '@angular/core';
import { Ease, easeInOutQuad } from '../utils/math';

type NumKey<T> = { [K in keyof T]: T[K] extends number ? K : never }[keyof T] & string;

interface Tween {
  obj: Record<string, number>;
  key: string;
  from: number;
  to: number;
  ms: number;
  t: number;
  ease: Ease;
  res: () => void;
}

/** Reloj de la animación (`time`, en segundos) y tweens que avanzan con cada frame. */
@Injectable({ providedIn: 'root' })
export class TweenService {
  time = 0;
  private readonly tweens: Tween[] = [];

  tween<T extends object>(target: T, key: NumKey<T>, to: number, ms: number, ease: Ease = easeInOutQuad): Promise<void> {
    const obj = target as unknown as Record<string, number>;
    const tweens = this.tweens;
    for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].obj === obj && tweens[i].key === key) { tweens[i].res(); tweens.splice(i, 1); }
    return new Promise(res => tweens.push({ obj, key, from: obj[key], to, ms, t: 0, ease, res }));
  }

  step(dt: number) {
    this.time += dt;
    const tweens = this.tweens;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i]; tw.t += dt * 1000;
      const k = Math.min(tw.t / tw.ms, 1);
      tw.obj[tw.key] = tw.from + (tw.to - tw.from) * tw.ease(k);
      if (k >= 1) { tweens.splice(i, 1); tw.res(); }
    }
  }
}
