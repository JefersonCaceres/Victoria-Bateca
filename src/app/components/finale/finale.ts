import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
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

  /** Fotos que sí cargaron, en el orden de la configuración. */
  protected readonly fotos = signal<string[]>([]);
  protected readonly actual = signal(0);
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

  constructor() {
    // se cargan desde el inicio para que estén listas cuando aparezca el círculo
    const ok = new Set<string>();
    for (const src of STORY.fotos) {
      const img = new Image();
      img.onload = () => { ok.add(src); this.fotos.set(STORY.fotos.filter(f => ok.has(f))); };
      img.src = src;
    }
    // se cambian solo cuando la foto ya está a la vista
    const id = setInterval(() => {
      const n = this.fotos().length;
      if (this.s.photoOn() && n > 1) this.actual.update(i => (i + 1) % n);
    }, STORY.segundosPorFoto * 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  protected volver() { location.reload(); }
}
