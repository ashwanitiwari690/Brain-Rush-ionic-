import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AudioService } from './services/audio.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: '<ion-app><ion-router-outlet></ion-router-outlet></ion-app>'
})
export class AppComponent implements OnInit, OnDestroy {
  private firstInteraction = () => {
    this.audio.unlock();
    window.removeEventListener('pointerdown', this.firstInteraction);
    window.removeEventListener('touchstart', this.firstInteraction);
    window.removeEventListener('keydown', this.firstInteraction);
  };

  constructor(private audio: AudioService) {}

  ngOnInit(): void {
    // Try immediately for native/webviews where autoplay is permitted.
    if (this.audio.musicEnabled) {
      this.audio.startMusic();
    }

    // For normal mobile browsers, Web Audio requires a user gesture.
    // The first interaction unlocks and starts the enabled music.
    window.addEventListener('pointerdown', this.firstInteraction, { passive: true });
    window.addEventListener('touchstart', this.firstInteraction, { passive: true });
    window.addEventListener('keydown', this.firstInteraction, { passive: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('pointerdown', this.firstInteraction);
    window.removeEventListener('touchstart', this.firstInteraction);
    window.removeEventListener('keydown', this.firstInteraction);
  }
}
