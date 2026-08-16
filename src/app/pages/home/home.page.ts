import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { GameLevel, GameModeId, GameService } from '../../services/game.service';
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
  private rewardRefreshId?: ReturnType<typeof setInterval>;
  private rewardTick = 0;

  constructor(public game: GameService, private router: Router, public language: LanguageService) {
    addIcons({
      settings, gameController, home, podium, personCircle, play, calendar, timer,
      lockClosed, checkmarkCircle, playCircle, closeCircle, gift
    });
  }

  ngOnInit(): void {
    this.rewardRefreshId = setInterval(() => { this.rewardTick++; }, 1000);
  }

  ngOnDestroy(): void {
    if (this.rewardRefreshId) clearInterval(this.rewardRefreshId);
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

  openRewardVideo(): void {
    if (this.game.rewardAdAvailable) this.rewardVideoOpen = true;
  }

  closeRewardVideo(): void {
    this.rewardVideoOpen = false;
  }

  onRewardVideoEnded(): void {
    if (this.game.claimRewardAdReward()) {
      this.rewardVideoOpen = false;
    }
  }

  playLevel(mode: GameModeId, level: GameLevel): void {
    if (!this.isUnlocked(mode, level)) return;
    this.router.navigate(['/game'], { queryParams: { mode, level } });
  }
}
