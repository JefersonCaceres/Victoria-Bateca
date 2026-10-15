import { Injectable, NgZone, inject } from '@angular/core';
import { FlightService } from './flight.service';
import { SceneService } from './scene.service';
import { TweenService } from './tween.service';

/** Único requestAnimationFrame: mueve los dos canvas, fuera de la zona de Angular. */
@Injectable({ providedIn: 'root' })
export class LoopService {
  private readonly zone = inject(NgZone);
  private readonly tw = inject(TweenService);
  private readonly flight = inject(FlightService);
  private readonly scene = inject(SceneService);
  private last = 0;
  private started = false;

  start() {
    if (this.started) return;
    this.started = true;
    this.zone.runOutsideAngular(() => requestAnimationFrame(t => { this.last = t; this.frame(t); }));
  }

  private readonly frame = (now: number) => {
    const dt = Math.min((now - this.last) / 1000, .05); this.last = now;
    this.tw.step(dt);
    this.flight.update();
    this.scene.sky?.draw(dt);
    this.scene.space?.render(dt);
    requestAnimationFrame(this.frame);
  };
}
