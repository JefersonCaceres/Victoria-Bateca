import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { STORY } from '../../data/story.data';
import { MusicService } from '../../services/music.service';
import { SceneService } from '../../services/scene.service';
import { sleep } from '../../utils/math';

@Component({
  selector: 'app-envelope',
  templateUrl: './envelope.html',
  styleUrl: './envelope.css'
})
export class Envelope {
  private readonly scene = inject(SceneService);
  private readonly music = inject(MusicService);
  private readonly letter = viewChild.required<ElementRef<HTMLElement>>('letter');

  protected readonly nombre = STORY.nombre;
  protected readonly opening = signal(false);
  protected readonly rise = signal(false);
  protected readonly gone = signal(false);
  protected readonly flapBehind = signal(false);
  protected readonly flash = signal<'idle' | 'on' | 'off'>('idle');
  protected readonly flashAt = signal({ x: 0, y: 0 });
  private opened = false;

  protected async open() {
    if (this.opened) return; this.opened = true;
    this.music.start();
    this.opening.set(true);
    await sleep(450);
    setTimeout(() => this.flapBehind.set(true), 450);
    await sleep(900);
    this.rise.set(true);
    await sleep(1100);
    const r = this.letter().nativeElement.getBoundingClientRect();
    this.flashAt.set({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    this.flash.set('on');
    await sleep(1300);
    this.gone.set(true);
    this.scene.run();
    this.flash.set('off');
  }
}
