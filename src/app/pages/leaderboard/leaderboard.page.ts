import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { TranslatePipe } from '../../services/translate.pipe';
import { arrowBack, search, createOutline, home, gameController, podium, personCircle, medal, close } from 'ionicons/icons';
import { GameService, Leader } from '../../services/game.service';

type Period = 'today' | 'week' | 'all';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports:[CommonModule, FormsModule, IonContent, IonIcon, TranslatePipe],
  templateUrl: 'leaderboard.page.html',
  styleUrls: ['leaderboard.page.scss']
})
export class LeaderboardPage {
  period: Period = 'today';
  searchText = '';
  leaders: Leader[] = [];

  constructor(public game: GameService, private router: Router) {
    addIcons({ arrowBack, search, createOutline, home, gameController, podium, personCircle, medal, close });
    this.refresh();
  }

  refresh(): void {
    this.leaders = this.game.getLeaderboard(this.period, this.searchText);
  }

  setPeriod(period: Period): void {
    this.period = period;
    this.refresh();
  }

  clearSearch(): void {
    this.searchText = '';
    this.refresh();
  }

  get firstThree(): Leader[] {
    return this.leaders.slice(0, 3);
  }

  get first(): Leader | undefined { return this.firstThree[0]; }
  get second(): Leader | undefined { return this.firstThree[1]; }
  get third(): Leader | undefined { return this.firstThree[2]; }

  isMe(player: Leader): boolean {
    return player.name === this.game.profile.name;
  }

  go(path: string): void {
    this.router.navigateByUrl(path);
  }
}
