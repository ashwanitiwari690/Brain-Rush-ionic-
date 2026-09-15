import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack, lockClosed, trophy, flame, flash, star, playCircle } from 'ionicons/icons';
import { AchievementKey, GameService } from '../../services/game.service';
import { RewardAdService } from '../../services/reward-ad.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { LanguageService } from '../../services/language.service';

interface Achievement {
  key: AchievementKey;
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
  isWatchingAd: AchievementKey | null = null;
  adErrorMessage = '';

  constructor(public game: GameService, private router: Router, public language: LanguageService, private rewardAd: RewardAdService) {
    addIcons({ arrowBack, lockClosed, trophy, flame, flash, star, playCircle });
  }

  get items(): Achievement[] {
    const accuracyProgress = Math.min(100, this.game.accuracy);
    const levelProgress = Math.min(100, Math.round((this.game.level / 50) * 100));
    const scoreProgress = Math.min(100, Math.round((this.game.bestScore / 10000) * 100));
    const streakProgress = Math.min(100, Math.round((this.game.streak / 7) * 100));

    return [
      { key: 'first', icon: '🏆', name: this.language.t('achievement.first.name'), description: this.language.t('achievement.first.desc'), progress: this.game.gamesPlayed > 0 ? 100 : 0, unlocked: this.game.gamesPlayed > 0 },
      { key: 'streak', icon: '🔥', name: this.language.t('achievement.streak.name'), description: this.language.t('achievement.streak.desc'), progress: streakProgress, unlocked: this.game.streak >= 7 },
      { key: 'speed', icon: '⚡', name: this.language.t('achievement.speed.name'), description: this.language.t('achievement.speed.desc'), progress: scoreProgress, unlocked: this.game.bestScore >= 10000 },
      { key: 'legend', icon: '🧠', name: this.language.t('achievement.legend.name'), description: this.language.t('achievement.legend.desc'), progress: levelProgress, unlocked: this.game.level >= 50 },
      { key: 'perfect', icon: '💎', name: this.language.t('achievement.perfect.name'), description: this.language.t('achievement.perfect.desc'), progress: accuracyProgress, unlocked: this.game.accuracy >= 100 }
    ];
  }

  get unlockedCount(): number {
    return this.items.filter(a => a.unlocked).length;
  }

  /**
   * `items` is a getter that returns new object literals on every change
   * detection cycle. Without trackBy, *ngFor's default reference-based
   * diffing would tear down and recreate every row (and its buttons) on
   * every CD tick — including the tap on the claim button itself, which
   * can cancel the click event between pointerdown and click.
   */
  trackByKey(_: number, item: Achievement): AchievementKey {
    return item.key;
  }

  get rewardCoins(): number {
    return this.game.achievementRewardCoins;
  }

  isClaimed(key: AchievementKey): boolean {
    return this.game.isAchievementClaimed(key);
  }

  async claim(achievement: Achievement): Promise<void> {
    if (!achievement.unlocked || this.isClaimed(achievement.key) || this.isWatchingAd) return;
    this.adErrorMessage = '';
    this.isWatchingAd = achievement.key;
    const granted = await this.rewardAd.watch();
    this.isWatchingAd = null;
    if (granted) {
      this.game.claimAchievementReward(achievement.key, achievement.unlocked);
    } else {
      this.adErrorMessage = this.language.t('common.adUnavailable');
    }
  }

  go(): void {
    this.router.navigateByUrl('/home');
  }
}
