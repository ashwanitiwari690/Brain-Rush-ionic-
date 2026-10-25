import { Injectable, signal } from '@angular/core';

export type AppLanguage = 'en';

const translations: Record<string, string> = {
  'common.home': 'HOME', 'common.play': 'PLAY', 'common.ranks': 'RANKS', 'common.profile': 'PROFILE',
  'common.back': 'Back', 'common.today': 'Today', 'common.week': 'Week', 'common.allTime': 'All Time',
  'common.coins': 'COINS', 'common.level': 'LEVEL', 'common.best': 'BEST', 'common.score': 'SCORE', 'common.totalScore': 'TOTAL SCORE',
  'common.timer': 'TIMER', 'common.lives': 'LIVES', 'common.combo': 'COMBO', 'common.accuracy': 'ACCURACY',
  'common.cancel': 'CANCEL', 'common.save': 'SAVE', 'common.settings': 'SETTINGS', 'common.playNow': 'PLAY NOW',
  'common.startChallenge': 'START CHALLENGE', 'common.playAgain': 'PLAY AGAIN', 'common.result': 'RESULT',
  'common.gameOver': 'GAME OVER', 'common.finalScore': 'FINAL SCORE', 'common.viewLeaderboard': 'VIEW LEADERBOARD',
  'common.topPlayers': 'TOP PLAYERS', 'common.newBest': 'NEW BEST!', 'common.xp': 'XP', 'common.reward': 'REWARD',
  'home.welcome': 'WELCOME BACK', 'home.tag': '60 SECOND CHALLENGE', 'home.headline1': 'How fast is', 'home.headline2': 'your brain?',
  'home.subtitle': 'Pick a challenge and chase your highest score.', 'home.gameModes': 'GAME MODES', 'home.challenges': '6 CHALLENGES',
  'home.daily': 'DAILY CHALLENGE', 'home.dailyMission': "TODAY'S MISSION", 'home.dailyScore': 'Score 60,000 points',
  'home.dailyReward': '30 coins reward', 'home.progress': 'YOUR PROGRESS', 'home.streak': 'day streak', 'home.games': 'games',
  'home.coinRules': 'COIN RULES', 'home.coinRulesTitle': 'How to earn coins',
  'home.levelCoins': 'First level completion', 'home.videoCoins': 'Reward video', 'home.dailyCoins': 'Daily challenge',
  'home.coinRulesNote': 'New levels pay coins only once. Reward videos pay 100 coins once every 2 hours. The daily challenge pays 30 coins once it is completed.',
  'home.rewardVideo': 'REWARD VIDEO', 'home.watchEarn': 'Watch & earn 100 coins', 'home.watchEarnDesc': 'Complete the reward video to receive 🪙100 coins. The next reward becomes available after 2 hours.',
  'home.watchVideo': 'WATCH VIDEO', 'home.videoCompletion': 'Watch the full video. Your 100-coin reward is credited only after the video finishes.',
  'mode.math.name': 'Math Rush', 'mode.math.desc': 'Calculate fast.', 'mode.reaction.name': 'Reaction Tap', 'mode.reaction.desc': 'React instantly.',
  'mode.memory.name': 'Memory', 'mode.memory.desc': 'Remember the sequence.', 'mode.color.name': 'Color Trap', 'mode.color.desc': 'Trust your eyes.',
  'mode.sequence.name': 'Number Sequence', 'mode.sequence.desc': 'Find the next number.', 'mode.quick.name': 'Quick Choice', 'mode.quick.desc': 'Choose before time.',
  'difficulty.easy': 'EASY', 'difficulty.medium': 'MEDIUM', 'difficulty.hard': 'HARD', 'difficulty.expert': 'EXPERT', 'difficulty.insane': 'INSANE', 'difficulty.fast': 'FAST',
  'level.easy': 'EASY', 'level.medium': 'MEDIUM', 'level.hard': 'HARD', 'levels.title': 'LEVELS', 'levels.level': 'LEVEL', 'levels.completeToUnlock': 'Finish a level to unlock the next one.', 'levels.scoreReward': 'SCORE REWARD',
  'daily.title': 'DAILY CHALLENGE', 'daily.mission': "TODAY'S MISSION", 'daily.score': 'Score {{value}} points',
  'daily.description': "Build today\'s score across quick 60-second runs. Reach 60,000 points to unlock 30 coins.",
  'daily.completionReward': 'COMPLETION REWARD', 'daily.rewardClaimed': 'Reward claimed today', 'daily.currentStreak': 'CURRENT STREAK',
  'daily.remaining': 'REMAINING', 'daily.complete': 'CHALLENGE COMPLETE', 'daily.start': 'START DAILY RUN',
  'daily.note': "You can play the daily run multiple times. Every run adds to today's target, while the 30-coin completion reward is awarded only once.",
  'levels.levelReward': 'LEVEL COMPLETION REWARD', 'levels.firstCompletion': 'FIRST COMPLETION', 'levels.completeForCoins': 'Complete a new level to earn +10 coins.', 'levels.showing': 'Showing levels {{start}}–{{end}}',
  'game.dailyChallenge': 'DAILY CHALLENGE', 'game.challenge60': '60 SECOND CHALLENGE', 'game.mathHelp': 'Solve as many equations as possible before time runs out.',
  'game.reactionHelp': 'Watch the moving signal. Tap the glowing target only when it turns green.', 'game.memoryHelp': 'Memorize a hidden number sequence, then reproduce it in the exact order.',
  'game.colorHelp': 'Choose the ink color, not the word you see.', 'game.sequenceHelp': 'Find the missing next number in the pattern.',
  'game.quickHelp': 'Make fast decisions before the clock beats you. Difficulty rises as your score climbs.', 'game.wait': 'WAIT', 'game.tap': 'TAP!',
  'game.go': 'GO!', 'game.waitGreen': 'Wait for the green signal...', 'game.memorize': 'MEMORIZE', 'game.repeat': 'REPEAT THE SEQUENCE',
  'game.watch': 'Watch carefully...', 'game.tapNext': 'Tap the next number in order.', 'game.whichColor': 'Which COLOR is the word printed in?',
  'game.nextNumber': 'Choose the next number.', 'game.even': 'Which number is EVEN?', 'game.odd': 'Which number is ODD?', 'game.prime': 'Which number is PRIME?', 'game.divisible3': 'Which number is divisible by 3?', 'game.divisibleBy': 'Which number is divisible by {{value}}?', 'game.multipleOf': 'Which number is a multiple of {{value}}?', 'game.closest50': 'Which number is closest to 50?', 'game.closestTo': 'Which number is closest to {{value}}?', 'game.largest': 'Choose the LARGEST number', 'game.smallest': 'Choose the SMALLEST number', 'game.square': 'Which number is a PERFECT SQUARE?', 'game.whichEquals': 'Which number equals {{expr}}?',
  'color.red': 'RED', 'color.blue': 'BLUE', 'color.green': 'GREEN', 'color.yellow': 'YELLOW', 'color.purple': 'PURPLE', 'color.orange': 'ORANGE', 'game.best': 'BEST', 'game.difficulty': 'DIFFICULTY',
  'leaderboard.title': 'LEADERBOARD', 'leaderboard.search': 'Search players', 'leaderboard.emptyTitle': 'No matching players',
  'leaderboard.emptyText': 'Try another search or play a game to enter the rankings.',
  'achievements.title': 'ACHIEVEMENTS', 'achievements.subtitle': 'Collect badges. Master every challenge.', 'achievements.complete': '% complete',
  'achievement.first.name': 'FIRST RUSH', 'achievement.first.desc': 'Complete your first game', 'achievement.streak.name': 'STREAK MASTER', 'achievement.streak.desc': 'Maintain a 7-day streak',
  'achievement.speed.name': 'SPEED DEMON', 'achievement.speed.desc': 'Score 10,000 points in a run', 'achievement.legend.name': 'BRAIN LEGEND', 'achievement.legend.desc': 'Reach level 50',
  'achievement.perfect.name': 'PERFECT', 'achievement.perfect.desc': 'Reach 100% lifetime accuracy',
  'profile.title': 'PROFILE', 'profile.achievements': 'Achievements', 'profile.stats': 'Stats', 'profile.bestScore': 'BEST SCORE', 'profile.gamesPlayed': 'GAMES PLAYED',
  'profile.currStreak': 'CURR STREAK', 'profile.edit': 'EDIT PROFILE', 'profile.editTitle': 'Edit Profile', 'profile.playerName': 'PLAYER NAME',
  'profile.about': 'ABOUT YOU', 'profile.chooseAvatar': 'CHOOSE AVATAR', 'profile.lifetimeAccuracy': 'LIFETIME ACCURACY', 'profile.totalGames': 'TOTAL GAMES',
  'profile.level': 'LEVEL', 'profile.firstRush': 'FIRST RUSH', 'profile.streak': 'STREAK', 'profile.speed': 'SPEED', 'profile.legend': 'LEGEND', 'profile.master': 'MASTER',
  'result.rank': 'Player rank', 'result.coinsBalance': 'COINS BALANCE', 'result.earned': 'EARNED', 'result.highCombo': 'HIGH COMBO', 'result.xpEarned': 'XP EARNED',
  'result.dailyBonus': 'Daily completion bonus +{{value}} coins',
  'settings.title': 'SETTINGS', 'settings.audio': 'GAME AUDIO', 'settings.sound': 'Sound Effects', 'settings.soundDesc': 'Clicks, correct answers and game sounds',
  'settings.music': 'Music', 'settings.musicDesc': 'Light background music during play', 'settings.haptics': 'Haptic Feedback', 'settings.hapticsDesc': 'Touch feedback on supported phones',
  'settings.account': 'ACCOUNT', 'settings.profile': 'Profile', 'settings.profileDesc': 'Edit your player name and avatar', 'settings.reset': 'Reset Progress', 'settings.resetDesc': 'Reset levels and scores; keep your coins',
  'settings.app': 'APP', 'settings.about': 'About Brain Rush', 'settings.aboutDesc': '60-second brain training challenges', 'settings.version': 'Version', 'settings.versionDesc': 'Mobile-ready Ionic build',
  'settings.resetConfirm': 'Reset gameplay progress? Your coins will be kept.',
  'settings.privacy': 'Privacy Policy', 'settings.privacyDesc': 'Data protection and policy details',
  'settings.adSettings': 'Ad Privacy Settings', 'settings.adSettingsDesc': 'Manage personalized ads and consent choices',
  'settings.adSettingsUnavailable': 'Ad privacy options are not required for your region or not available yet.',
  'settings.deleteAll': 'Delete Account & All Data', 'settings.deleteAllDesc': 'Permanently delete all profile, coins, and game data',
  'settings.deleteAllConfirm': 'Are you sure you want to delete ALL data? This will permanently delete your player profile, coins, best scores, and achievements. This action cannot be undone.',
  'privacy.title': 'PRIVACY POLICY', 'privacy.lastUpdated': 'Last updated: September 2026', 'privacy.back': 'Back',
  'settings.withdraw': 'WITHDRAW', 'settings.withdrawTitle': 'Withdraw coins', 'settings.withdrawDesc': 'Enter the 10-digit mobile number registered on your Earnivo account.', 'settings.withdrawNumber': '10-DIGIT NUMBER', 'settings.withdrawButton': 'WITHDRAW', 'settings.withdrawReady': 'Withdrawal UI is ready. API integration can be connected later.',
  'settings.withdrawMinimum': 'Reach {{min}} coins to unlock withdrawals.', 'settings.withdrawLoading': 'PROCESSING…',
  'settings.withdrawSuccess': 'Redemption successful', 'settings.withdrawSuccessDesc': '{{coins}} coins converted to ₹{{rupees}}. Your balance has been updated.', 'settings.withdrawDone': 'DONE',
  'settings.withdrawError': 'Redemption failed. Your coins are safe — please try again.',
  'settings.withdrawDuplicate': 'This redemption was already processed by the server. Your coins are safe; refresh your balance or contact support if it looks wrong.',
  'welcome.new': 'NEW CHALLENGE', 'welcome.sound': 'SOUND', 'welcome.music': 'MUSIC', 'common.on': 'ON', 'common.off': 'OFF', 'welcome.tag': '60 SECOND CHALLENGE', 'welcome.title1': 'TRAIN YOUR BRAIN.', 'welcome.title2': 'BEAT YOUR BEST.',
  'welcome.desc': 'Fast challenges. Bigger combos. One minute to prove how quick your mind can be.', 'welcome.how': 'HOW IT WORKS', 'welcome.rush': '60 SEC RUSH', 'welcome.ranks': 'CLIMB THE RANKS',
  'common.adLoading': 'LOADING AD…', 'common.adUnavailable': 'Ad not available right now. Please try again in a moment.',
  'result.doubleCoins': 'WATCH AD TO DOUBLE COINS', 'result.doubleCoinsDesc': 'Watch a short video to double the coins you just earned.', 'result.coinsDoubled': 'Coins doubled! 🎉',
  'daily.doubleReward': 'WATCH AD TO DOUBLE REWARD', 'daily.doubleRewardDesc': 'Watch a short video to double today\'s completion reward.', 'daily.rewardDoubled': 'Reward doubled today! 🎉',
  'achievements.claim': 'WATCH AD TO CLAIM', 'achievements.claimed': 'CLAIMED',
  'game.continueTitle': 'OUT OF LIVES', 'game.continueDesc': 'Watch a short video to get one extra life and keep your current score and combo.',
  'game.continueWatch': 'WATCH AD TO CONTINUE', 'game.continueDecline': 'END RUN'
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly language = signal<AppLanguage>('en');

  constructor() {
    // Clear legacy language cache so all devices use English exclusively
    try {
      localStorage.removeItem('brain-rush-language');
    } catch {
      // Ignore in environments where localStorage is restricted
    }
  }

  setLanguage(_language: AppLanguage): void {
    this.language.set('en');
  }

  t(key: string, params?: Record<string, string | number>): string {
    let value = translations[key] ?? key;
    if (params && Object.keys(params).length > 0) {
      for (const [name, replacement] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), String(replacement));
      }
    }
    return value;
  }
}
