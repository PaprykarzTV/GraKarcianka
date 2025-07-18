import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  play(src: string, volume = 1) {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play();
  }
}
