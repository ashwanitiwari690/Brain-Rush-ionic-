# Brain Rush — Ionic Angular Game

Brain Rush is a mobile-first 60-second brain challenge game built with Angular 20, Ionic 8 and Capacitor 7.

## Included features

- Welcome screen
- Home dashboard
- Six playable game modes:
  - Math Rush
  - Reaction Tap
  - Memory
  - Color Trap
  - Number Sequence
  - Quick Choice
- 10 sequential levels per game mode with progressively harder challenges
- 60-second timer, lives, combo and accuracy
- Sound effects and generated background music
- Haptic feedback setting
- Coin and XP economy (+10 per new level, +100 reward video every 2 hours, +30 daily challenge)
- Reward-video flow with persistent 2-hour cooldown
- Level progression
- Daily challenge with persistent daily progress and one-time reward
- Functional leaderboard:
  - Today
  - Week
  - All Time
  - Player search
  - Current-player highlighting
- Functional profile editing
- Profile stats
- Achievements with dynamic progress
- Settings
- LocalStorage persistence
- Capacitor-ready configuration
- No sidebar scrollbar; page scrolling is used

## Development

Recommended with your Node 24 installation:

```powershell
npm install
ng build
ng serve
```

For port 8100:

```powershell
npm run serve:8100
```

or:

```powershell
npm run ionic:serve:direct
```

The project is configured with Angular project name `app` and an explicit `defaultProject` in `ionic.config.json` so the Ionic CLI can resolve `app:serve`.

If `ionic serve` still reports `Unknown arguments: host, port`, run:

```powershell
npm run serve:8100
```

and check your global Ionic CLI:

```powershell
ionic --version
```

The application itself is served by Angular in that case; this is a CLI integration issue rather than game functionality.

## Android

After the web build works:

```powershell
npm install @capacitor/android@7.4.0
npx cap add android
npx cap sync android
npx cap open android
```

For future builds after code changes:

```powershell
ng build
npx cap sync android
```

Then build the APK/AAB from Android Studio.

## Important

Audio is generated with the Web Audio API, so the starter project does not depend on copyrighted external MP3 files. Music begins after a user interaction, which is required by browser/mobile autoplay rules.

Game progress, profile, leaderboard history, coins, XP, settings, reward-video cooldown and daily progress are stored locally for this prototype. The included reward video is an offline demo; production APKs should connect the completion callback to Google AdMob Rewarded Ads. A production online leaderboard should later use a backend API and database.


## Fresh-install vs update coin behavior

The game wallet is stored in the app's local game state. For Android builds, this package includes `scripts/prepare-android.mjs`, which sets `android:allowBackup="false"` in the generated Android manifest.

Use:

```powershell
npm install
npm run build
npm run cap:add:android
npm run cap:sync
```

After an **app update**, Android keeps the app data, so the existing coin balance remains.

After **uninstall + reinstall**, Android removes the app data and backup/restore is disabled for this app, so the coin balance starts from `0`.

If an Android platform already exists, run:

```powershell
npm run cap:prepare-android
npm run cap:sync
```

Do not use Settings > Reset Progress to test uninstall behavior: Reset Progress intentionally preserves coins by design.
