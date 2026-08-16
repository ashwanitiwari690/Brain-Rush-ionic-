import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack, lockClosed, trophy, flame, flash, star } from 'ionicons/icons';
import { GameService } from '../../services/game.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { LanguageService } from '../../services/language.service';

interface Achievement {
  icon: string;
  name: string;
  description: string;
  progress: number;
  unlocked: boolean;
}

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports:[CommonModule, IonContent, IonIcon, TranslatePipe],
  templateUrl: 'achievements.page.html',
  styleUrls: ['achievements.page.scss']
})
export class AchievementsPage {
  constructor(public game: GameService, private router: Router, public language: LanguageService) {
    addIcons({ arrowBack, lockClosed, trophy, flame, flash, star });
  }

  get items(): Achievement[] {
    const accuracyProgress = Math.min(100, this.game.accuracy);
    const levelProgress = Math.min(100, Math.round((this.game.level / 50) * 100));
    const scoreProgress = Math.min(100, Math.round((this.game.bestScore / 10000) * 100));
    const streakProgress = Math.min(100, Math.round((this.game.streak / 7) * 100));

    return [
      { icon: '🏆', name: this.language.t('achievement.first.name'), description: this.language.t('achievement.first.desc'), progress: this.game.gamesPlayed > 0 ? 100 : 0, unlocked: this.game.gamesPlayed > 0 },
      { icon: '🔥', name: this.language.t('achievement.streak.name'), description: this.language.t('achievement.streak.desc'), progress: streakProgress, unlocked: this.game.streak >= 7 },
      { icon: '⚡', name: this.language.t('achievement.speed.name'), description: this.language.t('achievement.speed.desc'), progress: scoreProgress, unlocked: this.game.bestScore >= 10000 },
      { icon: '🧠', name: this.language.t('achievement.legend.name'), description: this.language.t('achievement.legend.desc'), progress: levelProgress, unlocked: this.game.level >= 50 },
      { icon: '💎', name: this.language.t('achievement.perfect.name'), description: this.language.t('achievement.perfect.desc'), progress: accuracyProgress, unlocked: this.game.accuracy >= 100 }
    ];
  }

  get unlockedCount(): number {
    return this.items.filter(a => a.unlocked).length;
  }

  go(): void {
    this.router.navigateByUrl('/home');
  }
}
