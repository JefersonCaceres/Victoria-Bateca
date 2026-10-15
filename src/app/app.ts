import { AfterViewInit, Component, ElementRef, inject, viewChild } from '@angular/core';
import { Envelope } from './components/envelope/envelope';
import { Finale } from './components/finale/finale';
import { SkyCanvas } from './components/sky-canvas/sky-canvas';
import { Space3d } from './components/space-3d/space-3d';
import { StoryOverlay } from './components/story-overlay/story-overlay';
import { FlightService } from './services/flight.service';
import { LoopService } from './services/loop.service';
import { SceneService } from './services/scene.service';
import { ViewportService } from './services/viewport.service';

@Component({
  selector: 'app-root',
  imports: [SkyCanvas, Space3d, Envelope, StoryOverlay, Finale],
  template: `
    <app-sky-canvas />
    <app-space-3d />
    <div class="warp-flash" #warpFlash></div>
    <app-envelope />
    <app-story-overlay />
    <app-finale />`,
  styles: `.warp-flash{position:fixed;inset:0;z-index:2;pointer-events:none;opacity:0;
    background:radial-gradient(circle at 50% 40%,rgba(225,232,255,.95) 0%,rgba(170,150,255,.35) 35%,rgba(10,7,24,0) 75%)}`,
  host: { '(window:resize)': 'onResize()' }
})
export class App implements AfterViewInit {
  private readonly warpFlash = viewChild.required<ElementRef<HTMLElement>>('warpFlash');
  private readonly vp = inject(ViewportService);
  private readonly scene = inject(SceneService);
  private readonly flight = inject(FlightService);
  private readonly loop = inject(LoopService);

  ngAfterViewInit() {
    // los hijos ya registraron sus canvas (y el 3D ya empezó a generar sus texturas)
    this.flight.flashEl = this.warpFlash().nativeElement;
    Promise.all([document.fonts.load('80px "Great Vibes"'), document.fonts.load('700 80px "Dancing Script"')])
      .finally(() => this.loop.start());
  }

  protected onResize() {
    this.vp.update();
    this.scene.sky?.resize();
    this.scene.space?.resize();
  }
}
