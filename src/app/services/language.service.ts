import { Injectable, signal } from '@angular/core';

export type AppLanguage = 'en' | 'hi';

const translations: Record<AppLanguage, Record<string, string>> = {
  en: {
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
    'game.nextNumber': 'Choose the next number.', 'game.even': 'Which number is EVEN?', 'game.prime': 'Which number is PRIME?', 'game.divisible3': 'Which number is divisible by 3?', 'game.closest50': 'Which number is closest to 50?',
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
    'settings.language': 'LANGUAGE', 'settings.languageDesc': 'Choose your preferred app language', 'settings.english': 'English', 'settings.hindi': 'हिन्दी',
    'settings.resetConfirm': 'Reset gameplay progress? Your coins will be kept.',
    'settings.withdraw': 'WITHDRAW', 'settings.withdrawTitle': 'Withdraw coins', 'settings.withdrawDesc': 'Enter the 10-digit mobile number registered on your Earnivo account.', 'settings.withdrawNumber': '10-DIGIT NUMBER', 'settings.withdrawButton': 'WITHDRAW', 'settings.withdrawReady': 'Withdrawal UI is ready. API integration can be connected later.',
    'settings.withdrawMinimum': 'Reach {{min}} coins to unlock withdrawals.', 'settings.withdrawLoading': 'PROCESSING…',
    'settings.withdrawSuccess': 'Redemption successful', 'settings.withdrawSuccessDesc': '{{coins}} coins converted to ₹{{rupees}}. Your balance has been updated.',
    'settings.withdrawError': 'Redemption failed. Your coins are safe — please try again.',
    'settings.withdrawDuplicate': 'This redemption was already processed by the server. Your coins are safe; refresh your balance or contact support if it looks wrong.',
    'welcome.new': 'NEW CHALLENGE', 'welcome.language': 'LANGUAGE', 'welcome.sound': 'SOUND', 'welcome.music': 'MUSIC', 'common.on': 'ON', 'common.off': 'OFF', 'welcome.tag': '60 SECOND CHALLENGE', 'welcome.title1': 'TRAIN YOUR BRAIN.', 'welcome.title2': 'BEAT YOUR BEST.',
    'welcome.desc': 'Fast challenges. Bigger combos. One minute to prove how quick your mind can be.', 'welcome.how': 'HOW IT WORKS', 'welcome.rush': '60 SEC RUSH', 'welcome.ranks': 'CLIMB THE RANKS'
  },
  hi: {
    'common.home': 'होम', 'common.play': 'खेलें', 'common.ranks': 'रैंक', 'common.profile': 'प्रोफ़ाइल',
    'common.back': 'वापस', 'common.today': 'आज', 'common.week': 'सप्ताह', 'common.allTime': 'सभी समय',
    'common.coins': 'कॉइन्स', 'common.level': 'लेवल', 'common.best': 'सर्वश्रेष्ठ', 'common.score': 'स्कोर', 'common.totalScore': 'कुल स्कोर',
    'common.timer': 'टाइमर', 'common.lives': 'लाइफ़', 'common.combo': 'कॉम्बो', 'common.accuracy': 'सटीकता',
    'common.cancel': 'रद्द करें', 'common.save': 'सेव करें', 'common.settings': 'सेटिंग्स', 'common.playNow': 'अभी खेलें',
    'common.startChallenge': 'चैलेंज शुरू करें', 'common.playAgain': 'फिर खेलें', 'common.result': 'परिणाम',
    'common.gameOver': 'गेम ओवर', 'common.finalScore': 'अंतिम स्कोर', 'common.viewLeaderboard': 'लीडरबोर्ड देखें',
    'common.topPlayers': 'शीर्ष खिलाड़ी', 'common.newBest': 'नया सर्वश्रेष्ठ!', 'common.xp': 'XP', 'common.reward': 'इनाम',
    'home.welcome': 'वापसी पर स्वागत है', 'home.tag': '60 सेकंड चैलेंज', 'home.headline1': 'आपका दिमाग', 'home.headline2': 'कितना तेज़ है?',
    'home.subtitle': 'एक चैलेंज चुनें और अपना हाई स्कोर बनाएं।', 'home.gameModes': 'गेम मोड', 'home.challenges': '6 चैलेंज',
    'home.daily': 'दैनिक चैलेंज', 'home.dailyMission': 'आज का मिशन', 'home.dailyScore': '60,000 पॉइंट स्कोर करें',
    'home.dailyReward': '30 कॉइन्स इनाम', 'home.progress': 'आपकी प्रगति', 'home.streak': 'दिनों की स्ट्रीक', 'home.games': 'गेम',
    'home.coinRules': 'कॉइन नियम', 'home.coinRulesTitle': 'कॉइन कैसे कमाएं',
    'home.levelCoins': 'पहली बार लेवल पूरा', 'home.videoCoins': 'रिवॉर्ड वीडियो', 'home.dailyCoins': 'दैनिक चैलेंज',
    'home.coinRulesNote': 'नया लेवल पहली बार पूरा करने पर ही कॉइन मिलते हैं। रिवॉर्ड वीडियो से हर 2 घंटे में 100 कॉइन मिलते हैं। दैनिक चैलेंज पूरा करने पर 30 कॉइन मिलते हैं।',
    'home.rewardVideo': 'रिवॉर्ड वीडियो', 'home.watchEarn': 'वीडियो देखें और 100 कॉइन पाएं', 'home.watchEarnDesc': 'पूरा रिवॉर्ड वीडियो देखने के बाद 🪙100 कॉइन मिलेंगे। अगला रिवॉर्ड 2 घंटे बाद उपलब्ध होगा।',
    'home.watchVideo': 'वीडियो देखें', 'home.videoCompletion': 'पूरा वीडियो देखें। वीडियो खत्म होने के बाद ही 100 कॉइन आपके खाते में जोड़े जाएंगे।',
    'mode.math.name': 'मैथ रश', 'mode.math.desc': 'तेज़ी से गणना करें।', 'mode.reaction.name': 'रिएक्शन टैप', 'mode.reaction.desc': 'तुरंत प्रतिक्रिया दें।',
    'mode.memory.name': 'मेमोरी', 'mode.memory.desc': 'क्रम याद रखें।', 'mode.color.name': 'कलर ट्रैप', 'mode.color.desc': 'अपनी आँखों पर भरोसा करें।',
    'mode.sequence.name': 'नंबर सीक्वेंस', 'mode.sequence.desc': 'अगला नंबर खोजें।', 'mode.quick.name': 'क्विक चॉइस', 'mode.quick.desc': 'समय से पहले चुनें।',
    'difficulty.easy': 'आसान', 'difficulty.medium': 'मध्यम', 'difficulty.hard': 'कठिन', 'difficulty.expert': 'विशेषज्ञ', 'difficulty.insane': 'बहुत कठिन', 'difficulty.fast': 'तेज़',
    'level.easy': 'आसान', 'level.medium': 'मध्यम', 'level.hard': 'कठिन', 'levels.title': 'लेवल', 'levels.level': 'लेवल', 'levels.completeToUnlock': 'अगला लेवल अनलॉक करने के लिए इसे पूरा करें।', 'levels.scoreReward': 'स्कोर इनाम',
    'daily.title': 'दैनिक चैलेंज', 'daily.mission': 'आज का मिशन', 'daily.score': '{{value}} पॉइंट स्कोर करें',
    'daily.description': 'छोटे 60-सेकंड रन में आज का स्कोर बढ़ाएं। 60,000 पॉइंट पूरे करके 30 कॉइन पाएं।',
    'daily.completionReward': 'पूरा करने का इनाम', 'daily.rewardClaimed': 'आज का इनाम मिल चुका है', 'daily.currentStreak': 'वर्तमान स्ट्रीक',
    'daily.remaining': 'बाकी', 'daily.complete': 'चैलेंज पूरा', 'daily.start': 'दैनिक रन शुरू करें',
    'daily.note': 'आप दैनिक रन कई बार खेल सकते हैं। हर रन आज के लक्ष्य में जुड़ता है, जबकि 30 कॉइन का इनाम केवल एक बार मिलता है।',
    'levels.levelReward': 'लेवल पूरा करने का इनाम', 'levels.firstCompletion': 'पहली बार पूरा करने पर', 'levels.completeForCoins': 'नया लेवल पूरा करें और +10 कॉइन पाएं।', 'levels.showing': 'लेवल {{start}}–{{end}} दिख रहे हैं',
    'game.dailyChallenge': 'दैनिक चैलेंज', 'game.challenge60': '60 सेकंड चैलेंज', 'game.mathHelp': 'समय खत्म होने से पहले जितने हो सकें उतने सवाल हल करें।',
    'game.reactionHelp': 'चलते हुए संकेत को देखें। केवल हरा होने पर चमकते लक्ष्य को टैप करें।', 'game.memoryHelp': 'छिपे हुए नंबर क्रम को याद करें और बिल्कुल उसी क्रम में दोहराएं।',
    'game.colorHelp': 'जो शब्द दिख रहा है उसे नहीं, बल्कि उसके रंग को चुनें।', 'game.sequenceHelp': 'क्रम में अगला छूटा हुआ नंबर खोजें।',
    'game.quickHelp': 'घड़ी से पहले तेज़ निर्णय लें। स्कोर बढ़ने के साथ कठिनाई बढ़ती है।', 'game.wait': 'रुकें', 'game.tap': 'टैप!',
    'game.go': 'अब!', 'game.waitGreen': 'हरे संकेत का इंतज़ार करें...', 'game.memorize': 'याद करें', 'game.repeat': 'क्रम दोहराएं',
    'game.watch': 'ध्यान से देखें...', 'game.tapNext': 'क्रम में अगला नंबर टैप करें।', 'game.whichColor': 'शब्द किस रंग में लिखा है?',
    'game.nextNumber': 'अगला नंबर चुनें।', 'game.even': 'कौन सा नंबर सम है?', 'game.prime': 'कौन सा नंबर अभाज्य है?', 'game.divisible3': 'कौन सा नंबर 3 से विभाज्य है?', 'game.closest50': 'कौन सा नंबर 50 के सबसे करीब है?',
    'color.red': 'लाल', 'color.blue': 'नीला', 'color.green': 'हरा', 'color.yellow': 'पीला', 'color.purple': 'बैंगनी', 'color.orange': 'नारंगी', 'game.best': 'सर्वश्रेष्ठ', 'game.difficulty': 'कठिनाई',
    'leaderboard.title': 'लीडरबोर्ड', 'leaderboard.search': 'खिलाड़ी खोजें', 'leaderboard.emptyTitle': 'कोई खिलाड़ी नहीं मिला',
    'leaderboard.emptyText': 'दूसरी खोज आज़माएं या रैंकिंग में आने के लिए गेम खेलें।',
    'achievements.title': 'उपलब्धियां', 'achievements.subtitle': 'बैज जीतें और हर चैलेंज में महारत हासिल करें।', 'achievements.complete': '% पूरा',
    'achievement.first.name': 'पहली रश', 'achievement.first.desc': 'अपना पहला गेम पूरा करें', 'achievement.streak.name': 'स्ट्रीक मास्टर', 'achievement.streak.desc': '7 दिन की स्ट्रीक बनाए रखें',
    'achievement.speed.name': 'स्पीड डेमन', 'achievement.speed.desc': 'एक रन में 10,000 पॉइंट स्कोर करें', 'achievement.legend.name': 'ब्रेन लीजेंड', 'achievement.legend.desc': 'लेवल 50 तक पहुंचें',
    'achievement.perfect.name': 'परफेक्ट', 'achievement.perfect.desc': '100% लाइफ़टाइम सटीकता पाएं',
    'profile.title': 'प्रोफ़ाइल', 'profile.achievements': 'उपलब्धियां', 'profile.stats': 'आंकड़े', 'profile.bestScore': 'सर्वश्रेष्ठ स्कोर', 'profile.gamesPlayed': 'खेले गए गेम',
    'profile.currStreak': 'वर्तमान स्ट्रीक', 'profile.edit': 'प्रोफ़ाइल संपादित करें', 'profile.editTitle': 'प्रोफ़ाइल संपादित करें', 'profile.playerName': 'खिलाड़ी का नाम',
    'profile.about': 'आपके बारे में', 'profile.chooseAvatar': 'अवतार चुनें', 'profile.lifetimeAccuracy': 'लाइफ़टाइम सटीकता', 'profile.totalGames': 'कुल गेम',
    'profile.level': 'लेवल', 'profile.firstRush': 'पहली रश', 'profile.streak': 'स्ट्रीक', 'profile.speed': 'स्पीड', 'profile.legend': 'लीजेंड', 'profile.master': 'मास्टर',
    'result.rank': 'खिलाड़ी रैंक', 'result.coinsBalance': 'कॉइन बैलेंस', 'result.earned': 'मिले', 'result.highCombo': 'हाई कॉम्बो', 'result.xpEarned': 'कमाया XP',
    'result.dailyBonus': 'दैनिक पूरा करने का बोनस +{{value}} कॉइन्स',
    'settings.title': 'सेटिंग्स', 'settings.audio': 'गेम ऑडियो', 'settings.sound': 'साउंड इफेक्ट्स', 'settings.soundDesc': 'क्लिक, सही जवाब और गेम की आवाज़ें',
    'settings.music': 'म्यूज़िक', 'settings.musicDesc': 'गेम के दौरान हल्का बैकग्राउंड म्यूज़िक', 'settings.haptics': 'हैप्टिक फीडबैक', 'settings.hapticsDesc': 'सपोर्टेड फोन पर टच फीडबैक',
    'settings.account': 'अकाउंट', 'settings.profile': 'प्रोफ़ाइल', 'settings.profileDesc': 'खिलाड़ी का नाम और अवतार बदलें', 'settings.reset': 'प्रगति रीसेट करें', 'settings.resetDesc': 'लेवल और स्कोर रीसेट करें; कॉइन्स सुरक्षित रहेंगे',
    'settings.app': 'ऐप', 'settings.about': 'ब्रेन रश के बारे में', 'settings.aboutDesc': '60 सेकंड के ब्रेन ट्रेनिंग चैलेंज', 'settings.version': 'वर्ज़न', 'settings.versionDesc': 'मोबाइल के लिए तैयार Ionic बिल्ड',
    'settings.language': 'भाषा', 'settings.languageDesc': 'ऐप की पसंदीदा भाषा चुनें', 'settings.english': 'English', 'settings.hindi': 'हिन्दी',
    'settings.resetConfirm': 'क्या आप गेम की प्रगति रीसेट करना चाहते हैं? आपके कॉइन्स सुरक्षित रहेंगे।',
    'settings.withdraw': 'निकासी', 'settings.withdrawTitle': 'कॉइन निकालें', 'settings.withdrawDesc': 'अपने Earnivo खाते में पंजीकृत 10 अंकों का मोबाइल नंबर दर्ज करें।', 'settings.withdrawNumber': '10 अंकों का नंबर', 'settings.withdrawButton': 'निकासी करें', 'settings.withdrawReady': 'निकासी UI तैयार है। API को बाद में जोड़ा जा सकता है।',
    'settings.withdrawMinimum': 'निकासी अनलॉक करने के लिए {{min}} कॉइन्स तक पहुंचें।', 'settings.withdrawLoading': 'प्रोसेस हो रहा है…',
    'settings.withdrawSuccess': 'निकासी सफल रही', 'settings.withdrawSuccessDesc': '{{coins}} कॉइन्स ₹{{rupees}} में बदले गए। आपका बैलेंस अपडेट हो गया है।',
    'settings.withdrawError': 'निकासी विफल रही। आपके कॉइन्स सुरक्षित हैं — कृपया दोबारा कोशिश करें।',
    'settings.withdrawDuplicate': 'यह निकासी सर्वर द्वारा पहले ही प्रोसेस की जा चुकी है। आपके कॉइन्स सुरक्षित हैं; अपना बैलेंस रीफ्रेश करें या गड़बड़ी लगे तो सहायता से संपर्क करें।',
    'welcome.new': 'नया चैलेंज', 'welcome.language': 'भाषा', 'welcome.sound': 'साउंड', 'welcome.music': 'म्यूज़िक', 'common.on': 'चालू', 'common.off': 'बंद', 'welcome.tag': '60 सेकंड चैलेंज', 'welcome.title1': 'अपने दिमाग को ट्रेन करें।', 'welcome.title2': 'अपना रिकॉर्ड तोड़ें।',
    'welcome.desc': 'तेज़ चैलेंज। बड़े कॉम्बो। सिर्फ एक मिनट में अपनी सोच की गति साबित करें।', 'welcome.how': 'कैसे खेलें', 'welcome.rush': '60 सेकंड रश', 'welcome.ranks': 'रैंकिंग में ऊपर जाएं'
  }
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly language = signal<AppLanguage>(this.loadLanguage());

  setLanguage(language: AppLanguage): void {
    this.language.set(language);
    localStorage.setItem('brain-rush-language', language);
  }

  t(key: string, params: Record<string, string | number> = {}): string {
    const currentLanguage: AppLanguage = this.language();
    let value = translations[currentLanguage][key] ?? translations.en[key] ?? key;
    Object.entries(params).forEach(([name, replacement]) => {
      value = value.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), String(replacement));
    });
    return value;
  }

  private loadLanguage(): AppLanguage {
    const saved = localStorage.getItem('brain-rush-language');
    return saved === 'hi' ? 'hi' : 'en';
  }
}
