import { Component, inject } from '@angular/core';
import { SceneService } from '../../services/scene.service';

@Component({
  selector: 'app-story-overlay',
  template: `
    <div class="story">
      <p class="chap" [class.on]="s.chapOn()">{{ s.item()?.titulo }}</p>
      <p class="date" [class.on]="s.dateOn()">{{ s.item()?.fecha }}</p>
      <p class="phrase" [class.on]="s.lineOn()">{{ s.item()?.texto }}</p>
    </div>`,
  styleUrl: './story-overlay.css'
})
export class StoryOverlay {
  protected readonly s = inject(SceneService);
}
