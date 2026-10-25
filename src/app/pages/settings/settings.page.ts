import { ChangeDetectionStrategy, Component } from '@angular/core';
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
  trashBin,
  informationCircle,
  shieldCheckmark,
  optionsOutline
} from 'ionicons/icons';
import { AudioService } from '../../services/audio.service';
import { GameService } from '../../services/game.service';
import { AdmobService } from '../../services/admob.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonIcon, IonToggle, TranslatePipe],
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss']
})
export class SettingsPage {

  constructor(
    private router: Router,
    public audio: AudioService,
    public game: GameService,
    public admob: AdmobService,
    public language: LanguageService
  ) {
    addIcons({
      arrowBack,
      volumeHigh,
      musicalNotes,
      pulse,
      personCircle,
      trash,
      trashBin,
      informationCircle,
      shieldCheckmark,
      optionsOutline
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

  openPrivacyPolicy() {
    this.router.navigateByUrl('/privacy-policy');
  }

  async openAdPrivacySettings() {
    const success = await this.admob.showPrivacyOptions();
    if (!success) {
      alert(this.language.t('settings.adSettingsUnavailable'));
    }
  }

  reset() {
    if (confirm(this.language.t('settings.resetConfirm'))) {
      this.game.resetProgress();
    }
  }

  deleteAll() {
    if (confirm(this.language.t('settings.deleteAllConfirm'))) {
      this.game.deleteAllUserData();
    }
  }
}
