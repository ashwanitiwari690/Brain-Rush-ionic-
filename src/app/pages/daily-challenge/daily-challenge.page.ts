import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack, play, trophy, flame, checkmarkCircle } from 'ionicons/icons';
import { GameService } from '../../services/game.service';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-daily',
  standalone: true,
  imports:[CommonModule, IonContent, IonIcon, TranslatePipe],
  templateUrl: 'daily-challenge.page.html',
  styleUrls: ['daily-challenge.page.scss']
})
export class DailyChallengePage {
  readonly today = new Date();
  readonly todayMonth = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(this.today).toUpperCase();
  readonly todayDay = this.today.getDate();

  constructor(public game: GameService, private router: Router) {
    addIcons({ arrowBack, play, trophy, flame, checkmarkCircle });
  }

  go(path: string): void {
    this.router.navigateByUrl(path);
  }

  start(): void {
    if (this.game.dailyAvailable) {
      this.router.navigateByUrl('/game?mode=quick&daily=1');
    }
  }
}
