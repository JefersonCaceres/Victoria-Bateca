import { Injectable, inject } from '@angular/core';
import { STORY } from '../data/story.data';
import { TweenService } from './tween.service';

interface AudioSessionNav { audioSession?: { type: string } }

/** Música de fondo. Debe arrancar dentro del toque a la carta (los celulares bloquean el audio sin un toque). */
@Injectable({ providedIn: 'root' })
export class MusicService {
  private readonly tw = inject(TweenService);
  private readonly audio = new Audio();
  private started = false;

  constructor() {
    const { archivo, desdeSegundo } = STORY.musica;
    this.audio.src = desdeSegundo ? `${archivo}#t=${desdeSegundo}` : archivo;
    this.audio.loop = true;
    this.audio.preload = 'auto';
  }

  start() {
    if (this.started) return;
    this.started = true;
    const audio = this.audio, { segundosFadeIn } = STORY.musica;
    // el oído no es lineal: con la curva, 0.4 se oye como ~40 % (sin ella se oye como ~65 %)
    const volumen = Math.pow(STORY.musica.volumen, 2);
    const session = (navigator as AudioSessionNav).audioSession;
    if (session && window.AudioContext) {
      // iPhone (iOS 17+): el volumen del <audio> no se puede cambiar, así que el fade va por Web Audio;
      // 'playback' hace que suene aunque el teléfono esté en silencio
      try { session.type = 'playback'; } catch { /* sin efecto */ }
      const ctx = new AudioContext(), gain = ctx.createGain();
      ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volumen, ctx.currentTime + segundosFadeIn);
      ctx.resume();
    } else {
      audio.volume = 0;
      this.tw.tween(audio, 'volume', volumen, segundosFadeIn * 1000);
    }
    audio.play().catch(() => { /* sin archivo de música o el navegador no la deja sonar: se sigue sin música */ });
  }
}
