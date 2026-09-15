import { Injectable } from '@angular/core';
import { REWARD_CONFIG } from '../config/reward.config';

export type GameModeId = 'math' | 'reaction' | 'memory' | 'color' | 'sequence' | 'quick';
export type GameLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface LevelProgress {
  unlocked: GameLevel;
  completed: GameLevel[];
  bestScores: Partial<Record<GameLevel, number>>;
}

export interface Leader {
  rank: number;
  name: string;
  score: number;
  avatar: string;
  playedAt: number;
  mode?: string;
}

export interface LastResult {
  score: number;
  accuracy: number;
  combo: number;
  xp: number;
  coins: number;
  mode: string;
  modeId: GameModeId;
  level: GameLevel;
  levelReward: number;
  scoreBonusCoins: number;
  dailyBonus: number;
  newBest: boolean;
  /** Whether this round's coins were already doubled via the result-screen rewarded ad. */
  coinsDoubled: boolean;
}

export interface PlayerProfile {
  name: string;
  avatar: string;
  bio: string;
}

export interface GameHistory {
  id: number;
  score: number;
  accuracy: number;
  combo: number;
  coins: number;
  xp: number;
  mode: string;
  modeId?: GameModeId;
  level?: GameLevel;
  playedAt: number;
  daily: boolean;
}

export interface DailyState {
  date: string;
  score: number;
  target: number;
  completed: boolean;
  rewardClaimed: boolean;
  /** Whether today's completion reward was already doubled via a rewarded ad. */
  bonusDoubled: boolean;
}

/** Achievement badges that can be claimed once each for coins via a rewarded ad. */
export type AchievementKey = 'first' | 'streak' | 'speed' | 'legend' | 'perfect';

const MODE_IDS: GameModeId[] = ['math', 'reaction', 'memory', 'color', 'sequence', 'quick'];
const LEVELS: GameLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const MAX_LEVEL = 10;
const LEVEL_REWARD = 10;
const DAILY_TARGET = 60000;
const DAILY_REWARD = 30;
const REWARD_AD_COINS = 100;
const REWARD_AD_COOLDOWN_MS = 2 * 60 * 60 * 1000;
const ACHIEVEMENT_REWARD_COINS = 50;
const STATE_STORAGE_KEY = 'brain-rush-state';
const STATE_VERSION = 2;

function defaultLevelProgress(): LevelProgress {
  return { unlocked: 1, completed: [], bestScores: {} };
}

function defaultModeProgress(): Record<GameModeId, LevelProgress> {
  return {
    math: defaultLevelProgress(),
    reaction: defaultLevelProgress(),
    memory: defaultLevelProgress(),
    color: defaultLevelProgress(),
    sequence: defaultLevelProgress(),
    quick: defaultLevelProgress()
  };
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private _coins = 0;

  /** Coins are read-only to UI/pages; credits are issued centrally by completeGame(). */
  get coins(): number { return this._coins; }
  xp = 0;
  level = 1;
  bestScore = 0;
  gamesPlayed = 0;
  accuracy = 0;
  streak = 0;
  totalScore = 0;
  rewardAdNextAvailableAt = 0;
  /** Achievement keys already claimed for coins via the rewarded ad on the Achievements page. */
  claimedAchievements: AchievementKey[] = [];

  profile: PlayerProfile = {
    name: 'Pavel',
    avatar: '🧑‍🚀',
    bio: 'Fast mind. Bigger combos. Always chasing a new high score.'
  };

  modeProgress: Record<GameModeId, LevelProgress> = defaultModeProgress();

  lastResult: LastResult = {
    score: 8420,
    accuracy: 87,
    combo: 7,
    xp: 250,
    coins: 120,
    mode: 'Math Rush',
    modeId: 'math',
    level: 1,
    levelReward: 10,
    scoreBonusCoins: 0,
    dailyBonus: 0,
    newBest: false,
    coinsDoubled: false
  };

  history: GameHistory[] = [];
  daily: DailyState = this.createDailyState();

  private demoLeaders: Leader[] = [
    { rank: 1, name: 'Alex', score: 12450, avatar: '🧑‍🚀', playedAt: Date.now() - 2 * 60 * 60 * 1000, mode: 'Math Rush' },
    { rank: 2, name: 'Rahul', score: 11820, avatar: '🧑‍🎤', playedAt: Date.now() - 4 * 60 * 60 * 1000, mode: 'Reaction Tap' },
    { rank: 3, name: 'Priya', score: 10980, avatar: '👩‍🚀', playedAt: Date.now() - 7 * 60 * 60 * 1000, mode: 'Memory' },
    { rank: 4, name: 'Maya', score: 10540, avatar: '👩‍🎨', playedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, mode: 'Color Trap' },
    { rank: 5, name: 'Arjun', score: 10120, avatar: '🧑‍💻', playedAt: Date.now() - 5 * 24 * 60 * 60 * 1000, mode: 'Number Sequence' },
    { rank: 15, name: 'Pavel', score: 8420, avatar: '🧑‍🚀', playedAt: Date.now() - 60 * 60 * 1000, mode: 'Math Rush' }
  ];

  leaders: Leader[] = [...this.demoLeaders];

  constructor() {
    this.load();
  }

  get minRedeemCoins(): number { return REWARD_CONFIG.minRedeemCoins; }
  get levelReward(): number { return LEVEL_REWARD; }
  get dailyTarget(): number { return DAILY_TARGET; }
  get dailyReward(): number { return DAILY_REWARD; }
  get rewardAdCoins(): number { return REWARD_AD_COINS; }
  get rewardAdCooldownMs(): number { return REWARD_AD_COOLDOWN_MS; }
  get rewardAdAvailable(): boolean { return this.rewardAdRemainingMs <= 0; }
  get rewardAdRemainingMs(): number { return Math.max(0, this.rewardAdNextAvailableAt - Date.now()); }
  get availableLevels(): GameLevel[] { return LEVELS; }
  get maxGameLevel(): number { return MAX_LEVEL; }
  get achievementRewardCoins(): number { return ACHIEVEMENT_REWARD_COINS; }

  /** Whether today's completion reward can still be doubled via a rewarded ad. */
  get dailyBonusDoubleAvailable(): boolean {
    this.ensureDailyState();
    return this.daily.completed && this.daily.rewardClaimed && !this.daily.bonusDoubled;
  }

  private createDailyState(): DailyState {
    return { date: this.todayKey(), score: 0, target: DAILY_TARGET, completed: false, rewardClaimed: false, bonusDoubled: false };
  }

  private todayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  private ensureDailyState(): void {
    if (this.daily.date !== this.todayKey()) {
      this.daily = this.createDailyState();
      this.save();
    }
  }

  get dailyProgress(): number {
    this.ensureDailyState();
    return Math.min(100, Math.round((this.daily.score / this.daily.target) * 100));
  }

  get dailyRemaining(): number { return Math.max(0, this.daily.target - this.daily.score); }
  get dailyAvailable(): boolean { this.ensureDailyState(); return !this.daily.completed; }

  getLevelProgress(mode: GameModeId): LevelProgress {
    if (!this.modeProgress[mode]) this.modeProgress[mode] = defaultLevelProgress();
    return this.modeProgress[mode];
  }

  isLevelUnlocked(mode: GameModeId, level: GameLevel): boolean {
    return level <= this.getLevelProgress(mode).unlocked;
  }

  isLevelCompleted(mode: GameModeId, level: GameLevel): boolean {
    return this.getLevelProgress(mode).completed.includes(level);
  }

  getLevelBestScore(mode: GameModeId, level: GameLevel): number {
    return this.getLevelProgress(mode).bestScores[level] ?? 0;
  }

  getNextLevel(mode: GameModeId): GameLevel | null {
    const progress = this.getLevelProgress(mode);
    return progress.unlocked < MAX_LEVEL ? (progress.unlocked + 1) as GameLevel : null;
  }

  private save(): void {
    try {
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify({
        stateVersion: STATE_VERSION,
        coins: this._coins,
        xp: this.xp,
        level: this.level,
        bestScore: this.bestScore,
        gamesPlayed: this.gamesPlayed,
        accuracy: this.accuracy,
        streak: this.streak,
        totalScore: this.totalScore,
        rewardAdNextAvailableAt: this.rewardAdNextAvailableAt,
        claimedAchievements: this.claimedAchievements,
        modeProgress: this.modeProgress,
        lastResult: this.lastResult,
        history: this.history,
        daily: this.daily,
        profile: this.profile
      }));
    } catch {
      // Local storage can fail in private/embedded contexts. Gameplay still works.
    }
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STATE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);

        // Load only the fields owned by the service. This avoids accidentally
        // overwriting runtime methods/private state with malformed persisted data.
        if (typeof parsed.coins === 'number') this._coins = Math.max(0, Math.floor(parsed.coins));
        if (typeof parsed.xp === 'number') this.xp = Math.max(0, Math.floor(parsed.xp));
        if (typeof parsed.level === 'number') this.level = Math.max(1, Math.floor(parsed.level));
        if (typeof parsed.bestScore === 'number') this.bestScore = Math.max(0, Math.floor(parsed.bestScore));
        if (typeof parsed.gamesPlayed === 'number') this.gamesPlayed = Math.max(0, Math.floor(parsed.gamesPlayed));
        if (typeof parsed.accuracy === 'number') this.accuracy = Math.max(0, Math.min(100, Math.floor(parsed.accuracy)));
        if (typeof parsed.streak === 'number') this.streak = Math.max(0, Math.floor(parsed.streak));
        if (typeof parsed.totalScore === 'number') this.totalScore = Math.max(0, Math.floor(parsed.totalScore));
        if (typeof parsed.rewardAdNextAvailableAt === 'number') {
          this.rewardAdNextAvailableAt = Math.max(0, parsed.rewardAdNextAvailableAt);
        }
        if (Array.isArray(parsed.claimedAchievements)) {
          this.claimedAchievements = parsed.claimedAchievements.filter((k: unknown): k is AchievementKey =>
            typeof k === 'string' && (['first', 'streak', 'speed', 'legend', 'perfect'] as string[]).includes(k));
        }
        if (parsed.modeProgress && typeof parsed.modeProgress === 'object') {
          this.modeProgress = parsed.modeProgress;
        }
        if (Array.isArray(parsed.history)) this.history = parsed.history;
        if (parsed.daily && typeof parsed.daily === 'object') this.daily = parsed.daily;
        if (parsed.profile && typeof parsed.profile === 'object') this.profile = parsed.profile;
        if (parsed.lastResult && typeof parsed.lastResult === 'object') this.lastResult = parsed.lastResult;
      }
    } catch {
      // Keep demo defaults if local storage contains invalid data.
    }

    this.history = Array.isArray(this.history) ? this.history : [];

    // Migrate older daily-challenge data to the current 60,000-point target.
    // The daily completion reward remains 30 coins.
    if (!this.daily || Number(this.daily.target) !== DAILY_TARGET) {
      this.daily = this.createDailyState();
    } else {
      this.daily = {
        date: this.daily.date || this.todayKey(),
        score: Math.max(0, Number(this.daily.score) || 0),
        target: DAILY_TARGET,
        completed: Boolean(this.daily.completed),
        rewardClaimed: Boolean(this.daily.rewardClaimed),
        bonusDoubled: Boolean(this.daily.bonusDoubled)
      };
    }

    // Recover total score from older history if it was not stored.
    if (this.totalScore <= 0 && this.history.length) {
      this.totalScore = this.history.reduce((sum, item) => sum + Math.max(0, Number(item.score) || 0), 0);
    }
    this.totalScore = Math.max(0, Number(this.totalScore) || 0);
    this.reconcileProfileStats();
    this.rewardAdNextAvailableAt = Math.max(0, Number(this.rewardAdNextAvailableAt) || 0);

    this.lastResult = {
      score: Number(this.lastResult?.score) || 0,
      accuracy: Number(this.lastResult?.accuracy) || 0,
      combo: Number(this.lastResult?.combo) || 0,
      xp: Number(this.lastResult?.xp) || 0,
      coins: Number(this.lastResult?.coins) || 0,
      mode: this.lastResult?.mode || 'Math Rush',
      modeId: this.lastResult?.modeId || 'math',
      level: (Math.min(MAX_LEVEL, Math.max(1, Number(this.lastResult?.level) || 1)) as GameLevel),
      levelReward: Number(this.lastResult?.levelReward) || 0,
      scoreBonusCoins: Number(this.lastResult?.scoreBonusCoins) || 0,
      dailyBonus: Number(this.lastResult?.dailyBonus) || 0,
      newBest: Boolean(this.lastResult?.newBest),
      coinsDoubled: Boolean(this.lastResult?.coinsDoubled)
    };
    this.ensureDailyState();
    this.rebuildLeaderboard();
  }

  /**
   * Reconciles profile statistics with the persisted gameplay history.
   * The profile must never display placeholder/demo statistics.
   */
  private reconcileProfileStats(): void {
    if (!this.history.length) {
      this.gamesPlayed = 0;
      this.bestScore = 0;
      this.accuracy = 0;
      this.streak = 0;
      this.totalScore = 0;
      this.xp = 0;
      this.level = 1;
      return;
    }

    const historyBest = this.history.reduce((best, item) => Math.max(best, Math.max(0, Number(item.score) || 0)), 0);

    // History keeps only the latest 100 games, so preserve the lifetime
    // counters stored by the service and use history only as a recovery source.
    this.gamesPlayed = Math.max(this.history.length, Math.floor(Number(this.gamesPlayed) || 0));
    this.bestScore = Math.max(historyBest, Math.floor(Number(this.bestScore) || 0));

    if (!Number.isFinite(this.accuracy) || this.accuracy < 0 || this.accuracy > 100) {
      const accuracyValues = this.history
        .map(item => Number(item.accuracy))
        .filter(value => Number.isFinite(value));
      this.accuracy = accuracyValues.length
        ? Math.round(accuracyValues.reduce((sum, value) => sum + Math.max(0, Math.min(100, value)), 0) / accuracyValues.length)
        : 0;
    } else {
      this.accuracy = Math.round(this.accuracy);
    }

    this.streak = this.calculateCurrentStreak();
  }

  private calculateCurrentStreak(): number {
    const days = new Set(
      this.history
        .map(item => Number(item.playedAt))
        .filter(value => Number.isFinite(value) && value > 0)
        .map(value => this.dateKey(new Date(value)))
    );

    if (!days.size) return 0;

    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    let count = 0;

    while (days.has(this.dateKey(cursor))) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return count;
  }

  private dateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  private rebuildLeaderboard(period: 'today' | 'week' | 'all' = 'all'): void {
    const now = Date.now();
    const windowMs = period === 'today' ? 24 * 60 * 60 * 1000 : period === 'week' ? 7 * 24 * 60 * 60 * 1000 : Number.MAX_SAFE_INTEGER;
    const demo = this.demoLeaders.filter(p => now - p.playedAt <= windowMs && p.name !== this.profile.name && p.name !== 'Pavel');
    const mine = this.history.filter(h => now - h.playedAt <= windowMs).map(h => ({
      rank: 0, name: this.profile.name, score: h.score, avatar: this.profile.avatar, playedAt: h.playedAt, mode: h.mode
    }));
    const fallbackMine: Leader = { rank: 0, name: this.profile.name, score: this.lastResult.score, avatar: this.profile.avatar, playedAt: now, mode: this.lastResult.mode };
    const bestMine = mine.length ? mine.reduce((best, item) => item.score > best.score ? item : best) : fallbackMine;
    this.leaders = [...demo.filter(p => p.name !== this.profile.name), ...(bestMine ? [bestMine] : [])]
      .sort((a, b) => b.score - a.score).map((p, index) => ({ ...p, rank: index + 1 }));
  }

  getLeaderboard(period: 'today' | 'week' | 'all' = 'today', search = ''): Leader[] {
    this.rebuildLeaderboard(period);
    const term = search.trim().toLowerCase();
    return term ? this.leaders.filter(p => p.name.toLowerCase().includes(term)) : this.leaders;
  }

  completeGame(
    score: number,
    accuracy: number,
    combo: number,
    mode: string,
    daily = false,
    modeId: GameModeId = 'math',
    level: GameLevel = 1,
    levelCompleted = false
  ): void {
    this.ensureDailyState();

    const safeScore = Math.max(0, Math.round(score));
    const safeAccuracy = Math.max(0, Math.min(100, Math.round(accuracy)));
    const safeLevel = Math.min(MAX_LEVEL, Math.max(1, Number(level) || 1)) as GameLevel;
    const playedAt = Date.now();
    const progress = this.getLevelProgress(modeId);

    // +10 is a first-completion reward only. Losing the run cannot unlock/mint a level reward.
    const firstLevelCompletion = levelCompleted && !progress.completed.includes(safeLevel);
    const levelReward = firstLevelCompletion ? LEVEL_REWARD : 0;

    // Score is tracked for stats and daily progress. It never mints coins directly.
    this.totalScore += safeScore;
    const scoreBonusCoins = 0;

    if (firstLevelCompletion) {
      progress.completed = [...progress.completed, safeLevel].sort((a, b) => a - b) as GameLevel[];
      if (safeLevel === progress.unlocked && safeLevel < MAX_LEVEL) {
        progress.unlocked = (safeLevel + 1) as GameLevel;
      }
    }
    if (safeScore > (progress.bestScores[safeLevel] ?? 0)) progress.bestScores[safeLevel] = safeScore;

    const performanceXp = Math.min(300, 30 + Math.floor(safeScore / 120));
    let dailyBonus = 0;
    let dailyXpBonus = 0;
    if (daily) {
      this.daily.score = Math.min(this.daily.target, this.daily.score + safeScore);
      if (this.daily.score >= this.daily.target) this.daily.completed = true;
      if (this.daily.completed && !this.daily.rewardClaimed) {
        dailyBonus = DAILY_REWARD;
        dailyXpBonus = 250;
        this.daily.rewardClaimed = true;
      }
    }

    const earnedCoins = levelReward + scoreBonusCoins + dailyBonus;
    const earnedXp = performanceXp + dailyXpBonus;
    this._coins += earnedCoins;
    this.xp += earnedXp;
    this.gamesPlayed++;

    while (this.xp >= 100) { this.xp -= 100; this.level++; }

    const newBest = safeScore > this.bestScore;
    this.accuracy = Math.round(((this.accuracy * (this.gamesPlayed - 1)) + safeAccuracy) / this.gamesPlayed);
    this.bestScore = Math.max(this.bestScore, safeScore);

    const historyItem: GameHistory = {
      id: playedAt, score: safeScore, accuracy: safeAccuracy, combo: Math.max(0, combo), coins: earnedCoins,
      xp: earnedXp, mode, modeId, level: safeLevel, playedAt, daily
    };
    this.history.unshift(historyItem);
    this.history = this.history.slice(0, 100);
    this.streak = this.calculateCurrentStreak();

    this.lastResult = {
      score: safeScore, accuracy: safeAccuracy, combo: Math.max(0, combo), xp: earnedXp, coins: earnedCoins,
      mode, modeId, level: safeLevel, levelReward, scoreBonusCoins, dailyBonus, newBest, coinsDoubled: false
    };

    this.save();
    this.rebuildLeaderboard();
  }

  /**
   * Credits the one-time reward after a reward-video completion.
   * Must only be called after AdmobService.showRewarded()/RewardAdService.watch()
   * resolves true — i.e. AdMob's own OnUserEarnedReward callback confirmed the ad
   * was watched to completion, never optimistically from a click or ad-start event.
   */
  claimRewardAdReward(): boolean {
    if (!this.rewardAdAvailable) return false;
    this._coins += REWARD_AD_COINS;
    this.rewardAdNextAvailableAt = Date.now() + REWARD_AD_COOLDOWN_MS;
    this.save();
    return true;
  }

  /**
   * Doubles the coins earned in the last completed round. One-time per
   * result; the caller must only invoke this after a rewarded ad confirms
   * the reward (see claimRewardAdReward's contract).
   */
  doubleLastResultCoins(): boolean {
    if (this.lastResult.coins <= 0 || this.lastResult.coinsDoubled) return false;
    this._coins += this.lastResult.coins;
    this.lastResult = { ...this.lastResult, coinsDoubled: true };
    this.save();
    return true;
  }

  /**
   * Doubles today's daily-challenge completion reward (once). Only callable
   * once the daily reward has already been earned; the caller must only
   * invoke this after a rewarded ad confirms the reward.
   */
  claimDailyDoubleReward(): boolean {
    if (!this.dailyBonusDoubleAvailable) return false;
    this._coins += DAILY_REWARD;
    this.daily.bonusDoubled = true;
    this.save();
    return true;
  }

  isAchievementClaimed(key: AchievementKey): boolean {
    return this.claimedAchievements.includes(key);
  }

  /**
   * Credits the one-time coin reward for an unlocked achievement badge. The
   * caller (AchievementsPage) computes `unlocked` from live stats and must
   * only invoke this after a rewarded ad confirms the reward.
   */
  claimAchievementReward(key: AchievementKey, unlocked: boolean): boolean {
    if (!unlocked || this.isAchievementClaimed(key)) return false;
    this._coins += ACHIEVEMENT_REWARD_COINS;
    this.claimedAchievements = [...this.claimedAchievements, key];
    this.save();
    return true;
  }

  /**
   * Deducts coins locally only after the Central Game Reward API has confirmed
   * a redemption. `coinsRedeemed` must come from that backend response, never
   * from a locally-computed guess, and is clamped to the current balance so a
   * malformed response can never drive coins negative.
   */
  confirmRedemption(coinsRedeemed: number): void {
    const safeAmount = Math.max(0, Math.min(this._coins, Math.floor(coinsRedeemed) || 0));
    this._coins -= safeAmount;
    this.save();
  }

  updateProfile(profile: PlayerProfile): void {
    this.profile = { name: profile.name.trim() || 'Player', avatar: profile.avatar || '🧑‍🚀', bio: profile.bio.trim() };
    this.save();
    this.rebuildLeaderboard();
  }

  get recentGames(): GameHistory[] { return this.history.slice(0, 10); }

  get unlockedAchievements(): number {
    let count = 0;
    if (this.gamesPlayed > 0) count++;
    if (this.streak >= 7) count++;
    if (this.bestScore >= 10000) count++;
    if (this.level >= 50) count++;
    if (this.accuracy >= 100) count++;
    return count;
  }

  /**
   * Resets gameplay progress while deliberately preserving the user's coin balance.
   * Coins are a wallet/currency, not gameplay progress, so a settings reset must
   * never remove them.
   */
  resetProgress(): void {
    const preservedCoins = this._coins;

    this._coins = preservedCoins;
    this.xp = 0;
    this.level = 1;
    this.bestScore = 0;
    this.gamesPlayed = 0;
    this.accuracy = 0;
    this.streak = 0;
    this.totalScore = 0;
    this.rewardAdNextAvailableAt = 0;
    this.modeProgress = defaultModeProgress();
    this.history = [];
    this.daily = this.createDailyState();
    // Achievement badges reset alongside the stats that unlock them; already-earned
    // coins from previous claims are kept, matching how the coin wallet is preserved.
    this.claimedAchievements = [];

    // Profile identity is not gameplay progress, so keep the player's
    // name/avatar/bio when progress is reset.

    this.lastResult = {
      score: 0,
      accuracy: 0,
      combo: 0,
      xp: 0,
      coins: 0,
      mode: 'Math Rush',
      modeId: 'math',
      level: 1,
      levelReward: 0,
      scoreBonusCoins: 0,
      dailyBonus: 0,
      newBest: false,
      coinsDoubled: false
    };

    this.save();
    location.reload();
  }
}
