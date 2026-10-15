import { Injectable, computed, signal } from '@angular/core';

/** Medidas de la pantalla compartidas por los dos canvas y la foto. */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  W = 0; H = 0; cx = 0; cy = 0; DPR = 1;
  readonly reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  private readonly size = signal({ w: 0, h: 0 });
  /** Círculo de la foto (y del anillo de estrellas que la rodea). */
  readonly photoBox = computed(() => {
    const { w, h } = this.size(), r = Math.min(w, h) * .27;
    return { x: w / 2, y: h * .38, r };
  });

  constructor() { this.update(); }

  update() {
    this.DPR = Math.min(window.devicePixelRatio || 1, 2);
    this.W = innerWidth; this.H = innerHeight; this.cx = this.W / 2; this.cy = this.H / 2;
    this.size.set({ w: this.W, h: this.H });
  }
}
