import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBack, timer, heart, flame, play, flash, calculator, playCircle
} from 'ionicons/icons';
import { GameLevel, GameModeId, GameService } from '../../services/game.service';
import { AudioService } from '../../services/audio.service';
import { AdmobService } from '../../services/admob.service';
import { RewardAdService } from '../../services/reward-ad.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { LanguageService } from '../../services/language.service';

type Mode = 'math' | 'reaction' | 'memory' | 'color' | 'sequence' | 'quick';

@Component({
  selector: 'app-game',
  standalone: true,
  imports:[CommonModule, IonContent, IonIcon, TranslatePipe],
  templateUrl: 'game.page.html',
  styleUrls: ['game.page.scss']
})
export class GamePage implements OnInit, OnDestroy {
  mode: Mode = 'math';
  daily = false;
  started = false;
  time = 60;
  score = 0;
  lives = 3;
  combo = 0;
  correct = 0;
  answered = 0;
  level: GameLevel = 1;
  difficulty = 1;

  question = '5 + 7 = ?';
  answers: number[] = [11, 12, 13, 14];
  reactionReady = false;
  reactionX = 50;
  reactionY = 50;

  memorySequence: number[] = [];
  memoryVisible = true;
  memoryChoices: number[] = [];
  memoryNext = 0;

  colorWord = 'BLUE';
  colorInk = 'red';
  colorChoices = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
  private colorChoiceKeys: string[] = ['red', 'blue', 'green', 'yellow'];

  sequence: number[] = [2, 4, 6];
  sequenceChoices: number[] = [8, 9, 10, 12];

  quickQuestion = 'Which number is EVEN?';
  quickChoices: number[] = [7, 12, 15, 19];

  private targetAnswer = 12;
  private timerId?: ReturnType<typeof setInterval>;
  private reactionTimeout?: ReturnType<typeof setTimeout>;
  private memoryTimeout?: ReturnType<typeof setTimeout>;

  /** One "watch ad to continue" offer per game session, so it can't be farmed for infinite lives. */
  continueOffered = false;
  continueUsed = false;
  isWatchingContinueAd = false;
  continueAdError = false;

  /** True while the pre-round interstitial is loading/showing, gating the "Start Challenge" tap. */
  startingChallenge = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public game: GameService,
    private audio: AudioService,
    private admob: AdmobService,
    private rewardAd: RewardAdService,
    public language: LanguageService
  ) {
    addIcons({
      arrowBack, timer, heart, flame, play, flash, calculator, playCircle
    });
  }

  ngOnInit(): void {
    this.mode = (this.route.snapshot.queryParamMap.get('mode') as Mode) || 'math';
    this.daily = this.route.snapshot.queryParamMap.get('daily') === '1';
    if (this.daily) this.mode = 'quick';

    const requestedLevel = Number(this.route.snapshot.queryParamMap.get('level') || 1);
    const safeLevel = Math.min(this.game.maxGameLevel, Math.max(1, requestedLevel)) as GameLevel;
    this.level = this.game.isLevelUnlocked(this.mode, safeLevel) ? safeLevel : this.game.getLevelProgress(this.mode).unlocked;
    this.difficulty = this.level;
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.audio.stopMusic();
  }

  get title(): string {
    return ({
      math: this.language.t('mode.math.name').toUpperCase(),
      reaction: this.language.t('mode.reaction.name').toUpperCase(),
      memory: this.language.t('mode.memory.name').toUpperCase(),
      color: this.language.t('mode.color.name').toUpperCase(),
      sequence: this.language.t('mode.sequence.name').toUpperCase(),
      quick: this.language.t('mode.quick.name').toUpperCase()
    } as Record<Mode, string>)[this.mode];
  }

  get icon(): string {
    return ({
      math: '🧮',
      reaction: '⚡',
      memory: '🧠',
      color: '🎨',
      sequence: '🔢',
      quick: '🎯'
    } as Record<Mode, string>)[this.mode];
  }

  get difficultyLabel(): string { return `${this.language.t('levels.level')} ${this.level}`; }
  get levelLabel(): string { return `${this.language.t('levels.level')} ${this.level}`; }
  get timeLimit(): number { return Math.max(35, 60 - (this.level - 1) * 3); }
  get startingLives(): number { return this.level >= 9 ? 2 : 3; }

  /**
   * Shows a full-screen interstitial before every round starts, then begins
   * play once it's dismissed (or immediately if no ad was available/ready —
   * see AdmobService.showInterstitial's ~4s timeout). The button is disabled
   * for the duration so a slow ad load can't be double-tapped.
   */
  async start(): Promise<void> {
    if (this.startingChallenge) return;
    this.startingChallenge = true;
    this.audio.click();
    await this.admob.showInterstitial();
    this.startingChallenge = false;
    this.beginRound();
  }

  private beginRound(): void {
    this.started = true;
    this.time = this.timeLimit;
    this.score = 0;
    this.lives = this.startingLives;
    this.combo = 0;
    this.correct = 0;
    this.answered = 0;
    this.difficulty = this.level;
    this.continueOffered = false;
    this.continueUsed = false;
    this.continueAdError = false;
    this.clearTimers();
    this.audio.startMusic();
    this.nextRound();
    this.startTimer();
  }

  private startTimer(): void {
    this.timerId = setInterval(() => {
      this.time--;
      if (this.time <= 0) void this.endGame('time');
    }, 1000);
  }

  private nextRound(): void {
    if (this.mode === 'math') this.makeMath();
    if (this.mode === 'reaction') this.armReaction();
    if (this.mode === 'memory') this.makeMemory();
    if (this.mode === 'color') this.makeColor();
    if (this.mode === 'sequence') this.makeSequence();
    if (this.mode === 'quick') this.makeQuick();
  }

  private makeMath(): void {
    const level = this.level;
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
    let expression = '';
    let answer = 0;

    if (level <= 2) {
      const a = rand(10, 35 + level * 8);
      const b = rand(4, 20 + level * 5);
      const add = Math.random() > 0.5;
      const left = add ? a : Math.max(a, b);
      const right = add ? b : Math.min(a, b);
      expression = `${left} ${add ? '+' : '-'} ${right} = ?`;
      answer = add ? left + right : left - right;
    } else if (level <= 4) {
      const op = pick(['+', '-', '×']);
      const a = rand(12, 55 + level * 10);
      const b = op === '×' ? rand(3, 10 + level) : rand(6, 30);
      const left = op === '-' ? Math.max(a, b) : a;
      const right = op === '-' ? Math.min(a, b) : b;
      answer = op === '+' ? left + right : op === '-' ? left - right : left * right;
      expression = `${left} ${op} ${right} = ?`;
    } else if (level <= 6) {
      const op = Math.random() > 0.45 ? '×' : '÷';
      if (op === '×') {
        const a = rand(8, 45);
        const b = rand(4, 14);
        answer = a * b;
        expression = `${a} × ${b} = ?`;
      } else {
        const divisor = rand(3, 12);
        const quotient = rand(4, 20);
        const dividend = divisor * quotient;
        answer = quotient;
        expression = `${dividend} ÷ ${divisor} = ?`;
      }
    } else if (level <= 8) {
      const op1 = pick(['+', '-', '×']);
      const op2 = Math.random() > 0.55 ? '+' : '-';
      const a = rand(15, 80);
      const b = op1 === '×' ? rand(3, 9) : rand(5, 35);
      const c = rand(2, 20);
      const first = op1 === '+' ? a + b : op1 === '-' ? a - b : a * b;
      answer = op2 === '+' ? first + c : first - c;
      expression = `${a} ${op1} ${b} ${op2} ${c} = ?`;
    } else {
      const a = rand(18, 95);
      const b = rand(3, 11);
      const c = rand(4, 25);
      if (Math.random() > 0.5) {
        answer = a * b + c;
        expression = `${a} × ${b} + ${c} = ?`;
      } else {
        answer = a + b * c;
        expression = `${a} + ${b} × ${c} = ?`;
      }
    }

    this.targetAnswer = answer;
    this.question = expression;
    const spread = level >= 9 ? Math.max(2, Math.round(Math.abs(answer) * 0.025)) : level >= 7 ? Math.max(3, Math.round(Math.abs(answer) * 0.06)) : Math.max(3, Math.round(Math.abs(answer) * 0.12));
    const values = new Set<number>([answer]);
    while (values.size < 4) {
      const offset = Math.floor(Math.random() * (spread * 2 + 1)) - spread;
      if (offset !== 0) values.add(Math.max(0, answer + offset));
    }
    this.answers = [...values].sort(() => Math.random() - 0.5);
  }

  answer(value: number): void {
    if (!this.started) return;
    this.answered++;
    value === this.targetAnswer ? this.good() : this.bad();
    if (this.started) this.nextRound();
  }

  private makeMemory(): void {
    const length = Math.min(13, 4 + Math.floor((this.level - 1) * 0.95));
    const maxValue = this.level >= 8 ? 15 : this.level >= 5 ? 12 : 9;
    this.memorySequence = Array.from({ length }, () => Math.floor(Math.random() * maxValue) + 1);
    this.memoryNext = 0;
    this.memoryVisible = true;
    this.memoryChoices = [];
    this.memoryTimeout = setTimeout(() => {
      this.memoryVisible = false;
      this.buildMemoryChoices();
    }, Math.max(600, 1550 - this.level * 105));
  }

  private buildMemoryChoices(): void {
    const target = this.memorySequence[this.memoryNext];
    const choiceCount = this.level >= 8 ? 5 : 4;
    const maxValue = this.level >= 8 ? 15 : this.level >= 5 ? 12 : 9;
    const values = new Set<number>([target]);
    while (values.size < choiceCount) values.add(Math.floor(Math.random() * maxValue) + 1);
    this.memoryChoices = [...values].sort(() => Math.random() - 0.5);
  }

  memoryPick(value: number): void {
    if (!this.started || this.memoryVisible) return;
    this.answered++;
    if (value === this.memorySequence[this.memoryNext]) {
      this.correct++;
      this.combo++;
      this.score += 20 + this.combo * 4 + this.difficulty * 2;
      this.audio.correct();
      this.memoryNext++;
      if (this.memoryNext >= this.memorySequence.length) {
        this.score += 30 + this.difficulty * 5;
        this.audio.success();
        this.nextRound();
      } else {
        this.buildMemoryChoices();
      }
    } else {
      this.bad();
      if (this.started) this.nextRound();
    }
  }

  private makeColor(): void {
    const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'];
    const keys = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const count = this.level <= 2 ? 4 : this.level <= 5 ? 5 : 6;
    const wordIndex = Math.floor(Math.random() * count);
    let inkIndex = Math.floor(Math.random() * count);
    while (inkIndex === wordIndex) inkIndex = Math.floor(Math.random() * count);
    this.colorWord = this.language.t(`color.${keys[wordIndex]}`);
    this.colorInk = keys[inkIndex];
    this.colorChoiceKeys = keys.slice(0, count).sort(() => Math.random() - 0.5);
    this.colorChoices = this.colorChoiceKeys.map(key => this.language.t(`color.${key}`));
  }

  colorPick(value: string): void {
    if (!this.started) return;
    this.answered++;
    value === this.language.t(`color.${this.colorInk}`) ? this.good() : this.bad();
    if (this.started) this.nextRound();
  }

  private makeSequence(): void {
    const level = this.level;
    const startValue = Math.floor(Math.random() * (level >= 8 ? 18 : 10)) + 2;
    let values: number[] = [];
    let answer = 0;

    if (level <= 2) {
      const step = Math.floor(Math.random() * 7) + 2;
      values = [startValue, startValue + step, startValue + step * 2];
      answer = startValue + step * 3;
    } else if (level <= 4) {
      const step = Math.floor(Math.random() * 6) + 2;
      values = [startValue, startValue + step, startValue + step * 2, startValue + step * 3];
      answer = startValue + step * 4;
    } else if (level <= 6) {
      const factor = Math.floor(Math.random() * 2) + 2;
      values = [startValue, startValue * factor, startValue * factor * factor];
      answer = startValue * factor * factor * factor;
    } else if (level <= 8) {
      const stepA = Math.floor(Math.random() * 5) + 2;
      const stepB = Math.floor(Math.random() * 4) + 1;
      values = [startValue, startValue + stepA, startValue + stepA + stepB, startValue + stepA * 2 + stepB];
      answer = startValue + stepA * 2 + stepB * 2;
    } else {
      const a = startValue;
      const b = startValue + Math.floor(Math.random() * 5) + 2;
      const c = a + b;
      const d = b + c;
      values = [a, b, c, d];
      answer = c + d;
    }

    this.sequence = values;
    this.targetAnswer = answer;
    const spread = level >= 9 ? 3 : level >= 7 ? 5 : 7;
    const distractors = new Set<number>([answer]);
    while (distractors.size < 4) {
      const offset = Math.floor(Math.random() * (spread * 2 + 1)) - spread;
      if (offset !== 0) distractors.add(Math.max(1, answer + offset));
    }
    this.sequenceChoices = [...distractors].sort(() => Math.random() - 0.5);
  }

  sequencePick(value: number): void {
    if (!this.started) return;
    this.answered++;
    value === this.targetAnswer ? this.good() : this.bad();
    if (this.started) this.nextRound();
  }

  private makeQuick(): void {
    const level = this.level;
    const type = level <= 2 ? Math.floor(Math.random() * 2) : level <= 4 ? Math.floor(Math.random() * 3) : level <= 7 ? Math.floor(Math.random() * 4) : Math.floor(Math.random() * 5);
    let question = '';
    let answer = 0;
    let choices: number[] = [];
    const shuffle = <T>(items: T[]) => items.sort(() => Math.random() - 0.5);

    if (type === 0) {
      const even = Math.random() > 0.5;
      question = even ? this.language.t('game.even') : (this.language.language() === 'hi' ? 'कौन सा नंबर विषम है?' : 'Which number is ODD?');
      const base = level >= 8 ? Math.floor(Math.random() * 40) + 20 : 10;
      const good = even ? [base + 2, base + 6, base + 10, base + 14, base + 18] : [base + 1, base + 5, base + 9, base + 13, base + 17];
      const bad = even ? [base + 1, base + 5, base + 9, base + 13, base + 17] : [base + 2, base + 6, base + 10, base + 14, base + 18];
      answer = good[Math.floor(Math.random() * good.length)];
      choices = [answer, ...shuffle(bad).slice(0, 3)];
    } else if (type === 1) {
      question = this.language.t('game.prime');
      const primes = level >= 8 ? [47, 53, 59, 61, 67, 71, 73, 79] : [11, 13, 17, 19, 23, 29, 31];
      const nonPrimes = level >= 8 ? [48, 51, 55, 57, 63, 65, 69, 75] : [12, 15, 18, 21, 22, 24, 27];
      answer = primes[Math.floor(Math.random() * primes.length)];
      choices = [answer, ...shuffle(nonPrimes).slice(0, 3)];
    } else if (type === 2) {
      question = this.language.t('game.divisible3');
      const good = [24, 27, 33, 36, 42, 45, 51, 57, 63, 66];
      const bad = [25, 28, 31, 34, 38, 41, 43, 46, 49, 52];
      answer = good[Math.floor(Math.random() * good.length)];
      choices = [answer, ...shuffle(bad).slice(0, 3)];
    } else if (type === 3) {
      question = this.language.t('game.closest50');
      const center = level >= 8 ? 75 : 50;
      choices = shuffle([center - 11, center - 4, center + 2, center + 13]);
      answer = center + 2;
    } else {
      question = level >= 9
        ? (this.language.language() === 'hi' ? 'कौन सा गुणनफल 7 का गुणज है?' : 'Which product is a multiple of 7?')
        : (this.language.language() === 'hi' ? 'सबसे बड़ा नंबर चुनें' : 'Choose the largest number');
      if (level >= 9) { answer = 56; choices = shuffle([56, 54, 55, 58]); }
      else { answer = 99; choices = shuffle([99, 87, 92, 95]); }
    }

    this.quickQuestion = question;
    this.targetAnswer = answer;
    this.quickChoices = choices;
  }

  quickPick(value: number): void {
    if (!this.started) return;
    this.answered++;
    value === this.targetAnswer ? this.good() : this.bad();
    if (this.started) this.nextRound();
  }

  private moveReactionTarget(): void {
    // Reaction Tap is a pure reflex game: the target changes position every round,
    // making it visually and mechanically different from Memory.
    const slots = [
      [50, 50], [22, 25], [78, 25],
      [22, 72], [78, 72], [50, 88]
    ];
    const slot = slots[Math.floor(Math.random() * slots.length)];
    this.reactionX = slot[0];
    this.reactionY = slot[1];
  }

  private armReaction(): void {
    this.reactionReady = false;
    this.moveReactionTarget();
    const min = Math.max(180, 800 - this.level * 60);
    const max = Math.max(min + 250, 2100 - this.level * 100);
    this.reactionTimeout = setTimeout(() => this.reactionReady = true, min + Math.random() * (max - min));
  }

  tapReaction(): void {
    if (!this.started) return;

    if (!this.reactionReady) {
      this.lives--;
      this.combo = 0;
      this.audio.wrong();
      if (this.lives <= 0) this.handleLivesDepleted();
      return;
    }

    this.answered++;
    this.good();
    this.reactionReady = false;
    const delay = Math.max(180, 950 - this.level * 70);
    this.reactionTimeout = setTimeout(() => this.reactionReady = true, delay + Math.random() * Math.max(180, 550 - this.level * 30));
  }

  private good(): void {
    this.correct++;
    this.combo++;
    this.score += 20 + this.combo * 4 + this.difficulty * 2;
    this.audio.correct();
  }

  private bad(): void {
    this.lives--;
    this.combo = 0;
    this.audio.wrong();
    if (this.lives <= 0) this.handleLivesDepleted();
  }

  /**
   * Pauses the round instead of ending it immediately so the player can
   * offer a rewarded ad in exchange for one extra life. Limited to once per
   * game session (continueUsed) so it can't be farmed for endless retries.
   */
  private handleLivesDepleted(): void {
    if (this.continueUsed) {
      void this.endGame('lives');
      return;
    }
    this.started = false;
    this.clearTimers();
    this.audio.stopMusic();
    this.continueOffered = true;
  }

  async watchAdForContinue(): Promise<void> {
    if (this.isWatchingContinueAd) return;
    this.continueAdError = false;
    this.isWatchingContinueAd = true;
    const granted = await this.rewardAd.watch();
    this.isWatchingContinueAd = false;
    if (!granted) {
      this.continueAdError = true;
      return;
    }
    this.continueUsed = true;
    this.continueOffered = false;
    this.lives = 1;
    this.started = true;
    this.audio.startMusic();
    this.startTimer();
    this.nextRound();
  }

  declineContinue(): void {
    this.continueOffered = false;
    void this.endGame('lives');
  }

  async endGame(reason: 'time' | 'lives' = 'time'): Promise<void> {
    if (!this.started) return;
    this.started = false;
    this.clearTimers();
    this.audio.stopMusic();
    this.audio.gameOver();

    const accuracy = this.answered ? Math.round((this.correct / this.answered) * 100) : 0;
    const modeName = this.title
      .replace('RUSH', 'Rush')
      .replace('TAP', 'Tap')
      .replace('TRAP', 'Trap');

    const previousLevel = this.game.level;
    const levelCompleted = reason === 'time' && this.answered >= 8 && accuracy >= 50;
    this.game.completeGame(this.score, accuracy, this.combo, modeName, this.daily, this.mode as GameModeId, this.level, levelCompleted);
    if (this.game.level > previousLevel) this.audio.success();

    // Natural breakpoint: leaving a finished round. Frequency-capped inside
    // AdmobService so this doesn't show on every single round.
    await this.admob.maybeShowInterstitialAtBreakpoint();
    this.router.navigateByUrl('/result');
  }

  clearTimers(): void {
    if (this.timerId) clearInterval(this.timerId);
    if (this.reactionTimeout) clearTimeout(this.reactionTimeout);
    if (this.memoryTimeout) clearTimeout(this.memoryTimeout);
    this.timerId = undefined;
    this.reactionTimeout = undefined;
    this.memoryTimeout = undefined;
  }

  back(): void {
    if (this.continueOffered) {
      this.declineContinue();
      return;
    }
    if (this.started) {
      void this.endGame('lives');
      return;
    }
    this.router.navigateByUrl('/home');
  }
}
