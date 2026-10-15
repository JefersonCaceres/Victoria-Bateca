import { Injectable, inject } from '@angular/core';
import { TweenService } from './tween.service';
import { easeInOutQuint, easeOutQuad, linear } from '../utils/math';

export interface View { x: number; y: number; z: number; lx: number; ly: number; lz: number; }
const KEYS = ['x', 'y', 'z', 'lx', 'ly', 'lz'] as const;

/** Cámara 3D y salto a la velocidad de la luz. */
@Injectable({ providedIn: 'root' })
export class FlightService {
  private readonly tw = inject(TweenService);

  readonly CAM: View = { x: 0, y: 0, z: 20, lx: 0, ly: 0, lz: 0 };
  readonly FLY = { t: 1, from: null as View | null, to: null as View | null, warp: 0, ws: 1 };
  readonly FL = { v: 0 };
  flashEl: HTMLElement | null = null;

  flyTo(to: View, ms: number, ws = 1) {
    const FLY = this.FLY;
    FLY.from = { ...this.CAM }; FLY.to = to; FLY.ws = ws; FLY.t = 0;
    return this.tw.tween(FLY, 't', 1, ms, linear);
  }

  pulseFlash(v = .6) { this.FL.v = v; this.tw.tween(this.FL, 'v', 0, 1600, easeOutQuad); }

  update() {
    const FLY = this.FLY;
    let opacity: string;
    if (!FLY.from || !FLY.to) opacity = this.FL.v.toFixed(3);
    else {
      const t = FLY.t, e = easeInOutQuint(t);
      for (const k of KEYS) this.CAM[k] = FLY.from[k] + (FLY.to[k] - FLY.from[k]) * e;
      FLY.warp = Math.pow(Math.sin(Math.PI * t), 1.5) * FLY.ws;
      opacity = t > .78 && t < 1 ? (Math.sin((t - .78) / .22 * Math.PI) * .45 * FLY.ws).toFixed(3) : '0';
      if (t >= 1) { FLY.from = null; FLY.warp = 0; opacity = '0'; }
    }
    if (this.flashEl) this.flashEl.style.opacity = opacity;
  }
}
