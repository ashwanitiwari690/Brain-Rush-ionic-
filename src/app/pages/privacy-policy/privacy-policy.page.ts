import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack, shieldCheckmark, documentText, phonePortrait, lockClosed } from 'ionicons/icons';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonContent, IonIcon, TranslatePipe],
  templateUrl: './privacy-policy.page.html',
  styleUrls: ['./privacy-policy.page.scss']
})
export class PrivacyPolicyPage {
  constructor(
    private router: Router,
    private location: Location,
    public language: LanguageService
  ) {
    addIcons({ arrowBack, shieldCheckmark, documentText, phonePortrait, lockClosed });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl('/settings');
    }
  }
}

