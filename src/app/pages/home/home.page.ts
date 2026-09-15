import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { GameLevel, GameModeId, GameService } from '../../services/game.service';
import { RewardAdService } from '../../services/reward-ad.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { LanguageService } from '../../services/language.service';
import { addIcons } from 'ionicons';
import { settings, gameController, home, podium, personCircle, play, calendar, timer, lockClosed, checkmarkCircle, playCircle, closeCircle, gift } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, TranslatePipe],
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  readonly modes: { id: GameModeId; icon: string; nameKey: string; descKey: string }[] = [
    { id: 'math', icon: '🧮', nameKey: 'mode.math.name', descKey: 'mode.math.desc' },
    { id: 'reaction', icon: '⚡', nameKey: 'mode.reaction.name', descKey: 'mode.reaction.desc' },
    { id: 'memory', icon: '🧠', nameKey: 'mode.memory.name', descKey: 'mode.memory.desc' },
    { id: 'color', icon: '🎨', nameKey: 'mode.color.name', descKey: 'mode.color.desc' },
    { id: 'sequence', icon: '🔢', nameKey: 'mode.sequence.name', descKey: 'mode.sequence.desc' },
    { id: 'quick', icon: '🎯', nameKey: 'mode.quick.name', descKey: 'mode.quick.desc' }
  ];

  rewardVideoOpen = false;
  isWatchingNativeAd = false;
  adErrorMessage = '';
  private rewardRefreshId?: ReturnType<typeof setInterval>;

  constructor(
    public game: GameService,
    private router: Router,
    public language: LanguageService,
    public rewardAd: RewardAdService
  ) {
    addIcons({
      settings, gameController, home, podium, personCircle, play, calendar, timer,
      lockClosed, checkmarkCircle, playCircle, closeCircle, gift
    });
  }

  ngOnInit(): void {
    this.startCooldownTickerIfNeeded();
  }

  ngOnDestroy(): void {
    this.stopCooldownTicker();
  }

  /**
   * The reward-video cooldown text ("1h 59m", "58s"...) is a getter computed
   * from Date.now(), so it only refreshes on screen when change detection
   * runs. This ticks CD once a second, but only while a cooldown is actually
   * counting down — not for the component's entire lifetime — so idle time
   * (cooldown already expired, or never started) doesn't burn a per-second
   * app-wide change-detection pass for no visible reason.
   */
  private startCooldownTickerIfNeeded(): void {
    if (this.rewardRefreshId || this.game.rewardAdAvailable) return;
    this.rewardRefreshId = setInterval(() => {
      if (this.game.rewardAdAvailable) this.stopCooldownTicker();
    }, 1000);
  }

  private stopCooldownTicker(): void {
    if (this.rewardRefreshId) clearInterval(this.rewardRefreshId);
    this.rewardRefreshId = undefined;
  }

  go(path: string): void { this.router.navigateByUrl(path); }

  isUnlocked(mode: GameModeId, level: GameLevel): boolean {
    return this.game.isLevelUnlocked(mode, level);
  }

  isCompleted(mode: GameModeId, level: GameLevel): boolean {
    return this.game.isLevelCompleted(mode, level);
  }

  levelTitle(level: GameLevel): string {
    return `${this.language.t('levels.level')} ${level}`;
  }

  visibleLevels(mode: GameModeId): GameLevel[] {
    const unlocked = this.game.getLevelProgress(mode).unlocked;
    const start = Math.floor((unlocked - 1) / 3) * 3 + 1;
    return [start, start + 1, start + 2].filter((level): level is GameLevel => level <= this.game.maxGameLevel) as GameLevel[];
  }


  get scoreProgress(): number { return Math.min(100, Math.round((this.game.totalScore / 30000) * 100)); }

  get rewardCooldownText(): string {
    const totalSeconds = Math.ceil(this.game.rewardAdRemainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  async openRewardVideo(): Promise<void> {
    if (!this.game.rewardAdAvailable || this.isWatchingNativeAd) return;
    this.adErrorMessage = '';

    if (this.rewardAd.usesNativeAds) {
      // Native: the real full-screen AdMob ad takes over the screen, so no
      // local modal is shown — only a brief loading state on the button.
      this.isWatchingNativeAd = true;
      const granted = await this.rewardAd.watch();
      this.isWatchingNativeAd = false;
      if (granted) {
        this.game.claimRewardAdReward();
        this.startCooldownTickerIfNeeded();
      } else {
        this.adErrorMessage = this.language.t('common.adUnavailable');
      }
      return;
    }

    // Web/dev fallback: a local simulated video so the reward flow can be
    // tested without a device. Never runs on native.
    this.rewardVideoOpen = true;
  }

  closeRewardVideo(): void {
    this.rewardVideoOpen = false;
  }

  onRewardVideoEnded(): void {
    if (this.game.claimRewardAdReward()) {
      this.rewardVideoOpen = false;
      this.startCooldownTickerIfNeeded();
    }
  }

  playLevel(mode: GameModeId, level: GameLevel): void {
    if (!this.isUnlocked(mode, level)) return;
    this.router.navigate(['/game'], { queryParams: { mode, level } });
  }
}
