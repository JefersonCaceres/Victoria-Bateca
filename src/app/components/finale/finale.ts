import { Component, computed, inject, signal } from '@angular/core';
import { STORY, diasDesde } from '../../data/story.data';
import { SceneService } from '../../services/scene.service';
import { ViewportService } from '../../services/viewport.service';

@Component({
  selector: 'app-finale',
  templateUrl: './finale.html',
  styleUrl: './finale.css'
})
export class Finale {
  protected readonly s = inject(SceneService);
  private readonly vp = inject(ViewportService);

  protected readonly foto = STORY.foto;
  protected readonly fotoFalla = signal(false);
  protected readonly lineas = [
    { cls: 'l1', text: STORY.final.l1 },
    { cls: 'l2', text: STORY.final.l2 },
    { cls: 'l3', text: STORY.final.teAmo(STORY.nombre) },
    { cls: 'l4', text: STORY.final.dias(diasDesde(STORY.inicio)) }
  ];

  /** Posición de la foto y del texto final (placePhoto del prototipo). */
  protected readonly box = computed(() => {
    const { x, y, r } = this.vp.photoBox();
    return { size: r * 2 - 14, left: x - r + 7, top: y - r + 7, finaleTop: y + r + 30 };
  });

  protected volver() { location.reload(); }
}
