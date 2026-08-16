import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AudioService } from '../../services/audio.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { AppLanguage, LanguageService } from '../../services/language.service';
import { addIcons } from 'ionicons';
import {
  play,
  helpCircle,
  timer,
  sparkles,
  trophy,
  volumeHigh,
  volumeMute,
  musicalNotes,
  language as languageIcon
} from 'ionicons/icons';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [IonContent, IonIcon, TranslatePipe],
  templateUrl: 'welcome.page.html',
  styleUrls: ['welcome.page.scss']
})
export class WelcomePage implements OnInit, OnDestroy {
  private unlockHandler = () => {
    this.audio.unlock();
  };

  constructor(
    private router: Router,
    public audio: AudioService,
    public language: LanguageService
  ) {
    addIcons({
      play,
      helpCircle,
      timer,
      sparkles,
      trophy,
      volumeHigh,
      volumeMute,
      musicalNotes,
      language: languageIcon
    });
  }

  ngOnInit(): void {
    // Attempt to start immediately. Browsers may block autoplay.
    if (this.audio.musicEnabled) {
      this.audio.startMusic();
    }

    // The first tap/click unlocks Web Audio on browsers that require
    // a user gesture. Music then starts automatically.
    window.addEventListener('pointerdown', this.unlockHandler, {
      once: true,
      passive: true
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('pointerdown', this.unlockHandler);
  }

  play(): void {
    this.audio.unlock();
    this.audio.click();
    this.router.navigateByUrl('/home');
  }

  howItWorks(): void {
    this.audio.unlock();
    this.audio.click();
    this.router.navigateByUrl('/daily-challenge');
  }

  selectLanguage(value: AppLanguage): void {
    this.language.setLanguage(value);
    this.audio.unlock();
  }

  toggleMusic(): void {
    this.audio.setMusic(!this.audio.musicEnabled);
  }

  toggleSound(): void {
    this.audio.setSound(!this.audio.soundEnabled);
  }
}
