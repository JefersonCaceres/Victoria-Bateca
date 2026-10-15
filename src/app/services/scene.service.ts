import { Injectable, inject, signal } from '@angular/core';
import { STORY, StoryItem } from '../data/story.data';
import { sleep, linear } from '../utils/math';
import { TweenService } from './tween.service';
import { ViewportService } from './viewport.service';

/** Canvas 2D: nebulosa, estrellas de fondo y estrellas del nombre/anillo. */
export interface SkyApi {
  readonly S: { speed: number; target: number; alpha: number };
  readonly N: { alpha: number; zoom: number };
  readonly F: { alpha: number; ringRot: number };
  resize(): void;
  draw(dt: number): void;
  formName(): void;
  scatter(): void;
  formRing(): void;
}

/** Canvas WebGL. Solo se registra si WebGL está disponible. */
export interface SpaceApi {
  readonly p3: { alpha: number };
  readonly big: { alpha: number };
  resize(): void;
  render(dt: number): void;
  startName(): void;
  formName3D(): number;
  explodeName(): void;
  flyToStop(i: number, ms: number): Promise<void>;
  flyToFinal(): Promise<void>;
}

/** Estado de la secuencia y guion con los tiempos del prototipo. */
@Injectable({ providedIn: 'root' })
export class SceneService {
  private readonly tw = inject(TweenService);
  private readonly vp = inject(ViewportService);

  sky: SkyApi | null = null;
  space: SpaceApi | null = null;

  readonly item = signal<StoryItem | null>(null);
  readonly chapOn = signal(false);
  readonly dateOn = signal(false);
  readonly lineOn = signal(false);
  readonly photoOn = signal(false);
  /** Cuántas líneas del final se ven (0 a 4). */
  readonly finaleStep = signal(0);
  readonly replayOn = signal(false);

  private async say(item: StoryItem, secs: number) {
    this.item.set(item);
    this.chapOn.set(true); await sleep(350);
    this.dateOn.set(true); await sleep(450);
    this.lineOn.set(true);
    await sleep(secs * 1000);
    this.chapOn.set(false); this.dateOn.set(false); this.lineOn.set(false);
    await sleep(1100);
  }

  async run() {
    const sky = this.sky!, space = this.space, tw = this.tw, reduced = this.vp.reduced;

    // 2. galaxia y nombre
    tw.tween(sky.S, 'alpha', 1, 1500); sky.S.target = 25;
    tw.tween(sky.N, 'alpha', .55, 2500);
    if (space) {
      space.startName();
      await sleep(2000);
      const formado = space.formName3D();
      await sleep((formado + 4.5) * 1000);
    } else {
      await sleep(600);
      tw.tween(sky.F, 'alpha', 1, 1800);
      await sleep(1600);
      sky.formName();
      await sleep(8200);
    }

    // 3. viaje: un salto a la velocidad de la luz hacia cada momento
    if (space) space.explodeName(); else { sky.scatter(); tw.tween(sky.F, 'alpha', .25, 2500); }
    tw.tween(sky.N, 'alpha', 1, 3000);
    if (space) tw.tween(space.p3, 'alpha', 1, 2500);
    sky.S.target = reduced ? 20 : 60;
    const salto = reduced ? 1400 : 2600, historia = STORY.historia;
    tw.tween(sky.N, 'zoom', 1.7, (STORY.segundosPorFrase + 2 + salto / 1000) * 1000 * historia.length, linear);
    await sleep(1800);
    for (let i = 0; i < historia.length; i++) {
      if (space) await space.flyToStop(i, salto);
      await this.say(historia[i], STORY.segundosPorFrase);
    }
    // nos alejamos: todos los momentos forman una sola galaxia
    if (space) {
      tw.tween(space.big, 'alpha', .9, 4500);
      await space.flyToFinal();
    }

    // 4. la foto
    sky.S.target = 18; tw.tween(sky.N, 'alpha', .5, 2500);
    sky.formRing(); tw.tween(sky.F, 'alpha', 1, 1500);
    await sleep(1800);
    this.photoOn.set(true);
    await sleep(3200);

    // 5. final
    for (let i = 1; i <= 4; i++) { this.finaleStep.set(i); await sleep(2300); }
    await sleep(1500);
    this.replayOn.set(true);
  }
}
