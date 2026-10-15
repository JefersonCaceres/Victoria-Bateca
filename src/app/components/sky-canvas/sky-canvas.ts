import { AfterViewInit, Component, ElementRef, inject, viewChild } from '@angular/core';
import { STORY } from '../../data/story.data';
import { FlightService } from '../../services/flight.service';
import { SceneService, SkyApi } from '../../services/scene.service';
import { TweenService } from '../../services/tween.service';
import { ViewportService } from '../../services/viewport.service';
import { gauss, rand } from '../../utils/math';

const DEPTH = 1000;

interface FreeStar {
  x: number; y: number; vx: number; vy: number; tx: number; ty: number;
  mode: 'free' | 'target' | 'ring';
  k: number; s: number; f: number; p: number; ta: number; tr: number;
  delay: number; landed: boolean; spark: number;
}

@Component({
  selector: 'app-sky-canvas',
  template: '<canvas #cv aria-hidden="true"></canvas>',
  styles: 'canvas{position:fixed;inset:0;width:100%;height:100%;display:block}'
})
export class SkyCanvas implements AfterViewInit, SkyApi {
  private readonly cv = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private readonly vp = inject(ViewportService);
  private readonly tw = inject(TweenService);
  private readonly flight = inject(FlightService);
  private readonly story = inject(SceneService);
  private ctx!: CanvasRenderingContext2D;

  /* Estrellas de fondo en 3D (las que pasan a tu lado al viajar) */
  readonly S = { speed: 0, target: 25, alpha: 0 };
  private readonly bg = Array.from({ length: 320 }, () => ({ x: rand(-1000, 1000), y: rand(-1000, 1000), z: rand(1, DEPTH), p: rand(0, 6.28) }));

  /* Nebulosa de fondo */
  readonly N = { alpha: 0, zoom: 1 };
  private readonly img = new Image();

  /* Estrellas que escriben el nombre (respaldo sin WebGL) y rodean la foto */
  readonly F = { alpha: 0, ringRot: 0 };
  private readonly fp: FreeStar[] = Array.from({ length: 900 }, () => ({
    x: rand(0, this.vp.W), y: rand(0, this.vp.H), vx: rand(-8, 8), vy: rand(-8, 8),
    tx: 0, ty: 0, mode: 'free', k: rand(1.2, 2.8), s: rand(.7, 1.6), f: rand(1, 3), p: rand(0, 6.28),
    ta: 0, tr: 0, delay: 0, landed: false, spark: 0
  }));

  constructor() { this.img.src = 'nebula.jpg'; }

  ngAfterViewInit() {
    this.ctx = this.cv().nativeElement.getContext('2d')!;
    this.resize();
    this.story.sky = this;
  }

  resize() {
    const cv = this.cv().nativeElement, { W, H, DPR } = this.vp;
    cv.width = W * DPR; cv.height = H * DPR;
    this.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  private namePoints(text: string) {
    const { W, H, cx, cy } = this.vp;
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const o = off.getContext('2d')!;
    let size = Math.min(H * .22, 150);
    o.font = `${size}px "Great Vibes", cursive`;
    const w = o.measureText(text).width;
    if (w > W * .86) { size *= (W * .86) / w; o.font = `${size}px "Great Vibes", cursive`; }
    o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle';
    o.fillText(text, cx, cy - H * .04);
    const data = o.getImageData(0, 0, W, H).data, pts: [number, number][] = [];
    const step = Math.max(2, Math.round(size / 26));
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step)
      if (data[(y * W + x) * 4 + 3] > 140) pts.push([x, y]);
    for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
    return pts;
  }

  formName() {
    const pts = this.namePoints(STORY.nombre), time = this.tw.time;
    let minX = Infinity, maxX = -Infinity;
    for (const q of pts) { minX = Math.min(minX, q[0]); maxX = Math.max(maxX, q[0]); }
    this.fp.forEach((p, i) => {
      const q = pts[i % pts.length];
      p.tx = q[0] + rand(-1, 1); p.ty = q[1] + rand(-1, 1); p.mode = 'target'; p.landed = false;
      // las estrellas llegan de izquierda a derecha, como si escribieran el nombre
      p.delay = time + .4 + ((q[0] - minX) / (maxX - minX || 1)) * 3.2 + rand(0, .5);
      p.k = rand(1.6, 2.4);
    });
  }

  scatter() {
    const { cx, cy } = this.vp;
    this.fp.forEach(p => {
      const a = Math.atan2(p.y - cy, p.x - cx) + rand(-.6, .6), v = rand(30, 160);
      p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v; p.mode = 'free';
    });
  }

  formRing() {
    const box = this.vp.photoBox(), fp = this.fp;
    fp.forEach((p, i) => {
      p.mode = 'ring'; p.ta = (i / fp.length) * Math.PI * 2 * 3 + rand(-.05, .05);
      const layer = i % 3; p.tr = box.r + layer * 9 + gauss() * 4;
    });
  }

  draw(dt: number) {
    const ctx = this.ctx, { W, H, cx, cy } = this.vp, time = this.tw.time, warp = this.flight.FLY.warp;
    const S = this.S, N = this.N, F = this.F, img = this.img;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#0a0718'; ctx.fillRect(0, 0, W, H);
    if (N.alpha > .01 && img.complete && img.width) {
      const sc = Math.max(W / img.width, H / img.height) * N.zoom * (1 + .35 * warp);
      const iw = img.width * sc, ih = img.height * sc;
      ctx.globalAlpha = N.alpha; ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih); ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'lighter';

    // fondo 3D
    S.speed += (S.target - S.speed) * Math.min(1, dt * 1.5);
    if (warp > 0) S.speed = S.target + (this.vp.reduced ? 500 : 2600) * warp;
    const fov = Math.max(W, H) * .6;
    if (S.alpha > .01) for (const s of this.bg) {
      s.z -= S.speed * dt;
      if (s.z < 1) { s.z = DEPTH; s.x = rand(-1000, 1000); s.y = rand(-1000, 1000); }
      const sx = cx + s.x / s.z * fov, sy = cy + s.y / s.z * fov;
      if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;
      const near = 1 - s.z / DEPTH, r = .4 + near * 1.8;
      const a = S.alpha * (.35 + near * .65) * (.75 + .25 * Math.sin(time * 2 + s.p));
      ctx.strokeStyle = ctx.fillStyle = `rgba(235,230,255,${a})`;
      if (S.speed > 120) {
        const z2 = s.z + S.speed * .06;
        ctx.lineWidth = r; ctx.beginPath();
        ctx.moveTo(cx + s.x / z2 * fov, cy + s.y / z2 * fov); ctx.lineTo(sx, sy); ctx.stroke();
      } else { ctx.fillRect(sx - r / 2, sy - r / 2, r, r); }
    }

    // estrellas del nombre / anillo
    if (F.alpha > .01) {
      F.ringRot += dt * .12;
      const box = this.vp.photoBox();
      for (const p of this.fp) {
        if (p.mode === 'ring') {
          p.tx = box.x + Math.cos(p.ta + F.ringRot) * p.tr;
          p.ty = box.y + Math.sin(p.ta + F.ringRot) * p.tr;
        }
        const lx = p.x, ly = p.y;
        if (p.mode === 'free' || time < p.delay) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .985; p.vy *= .985;
          if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
          if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
        } else {
          const k = Math.min(1, dt * p.k);
          p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k;
          if (p.mode === 'target' && !p.landed && Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) < 1.5) { p.landed = true; p.spark = 1; }
        }
        // estela mientras vuela y destello al llegar a su lugar
        const dx = p.x - lx, dy = p.y - ly, mv = Math.hypot(dx, dy);
        if (mv > 1.2 && mv < 80) {
          ctx.strokeStyle = `rgba(255,214,236,${F.alpha * .45})`; ctx.lineWidth = p.s;
          ctx.beginPath(); ctx.moveTo(p.x - dx * 6, p.y - dy * 6); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
        if (p.spark > 0) {
          p.spark -= dt * 1.4;
          ctx.fillStyle = `rgba(255,236,246,${Math.max(0, p.spark) * .5 * F.alpha})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 7 * Math.max(0, p.spark), 0, 6.283); ctx.fill();
        }
        const a = F.alpha * (.55 + .45 * Math.sin(time * p.f + p.p));
        ctx.fillStyle = `rgba(255,214,236,${a * .22})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 2.6, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(255,248,252,${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * .8, 0, 6.283); ctx.fill();
      }
    }
  }
}
