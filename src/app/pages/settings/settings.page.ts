import { Component } from '@angular/core';
import { IonContent, IonIcon, IonToggle } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  volumeHigh,
  musicalNotes,
  pulse,
  personCircle,
  trash,
  informationCircle,
  language as languageIcon,
  chevronDown
} from 'ionicons/icons';
import { AudioService } from '../../services/audio.service';
import { GameService } from '../../services/game.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { AppLanguage, LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [IonContent, IonIcon, IonToggle, TranslatePipe],
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss']
})
export class SettingsPage {
  languageOpen = false;

  constructor(
    private router: Router,
    public audio: AudioService,
    public game: GameService,
    public language: LanguageService
  ) {
    addIcons({
      arrowBack,
      volumeHigh,
      musicalNotes,
      pulse,
      personCircle,
      trash,
      informationCircle,
      language: languageIcon,
      chevronDown
    });
  }

  go() {
    this.router.navigateByUrl('/home');
  }

  toggleSound(e: any) {
    this.audio.setSound(e.detail.checked);
  }

  toggleMusic(e: any) {
    this.audio.setMusic(e.detail.checked);
  }

  toggleHaptics(e: any) {
    this.audio.setHaptics(e.detail.checked);
  }

  openProfile() {
    this.router.navigateByUrl('/profile');
  }

  toggleLanguageMenu() {
    this.languageOpen = !this.languageOpen;
  }

  setLanguage(value: AppLanguage) {
    this.language.setLanguage(value);
    this.languageOpen = false;

    // Give immediate feedback when changing language if sound is enabled.
    if (this.audio.soundEnabled) {
      this.audio.click();
    }
  }


  reset() {
    if (confirm(this.language.t('settings.resetConfirm'))) {
      this.game.resetProgress();
    }
  }
}
