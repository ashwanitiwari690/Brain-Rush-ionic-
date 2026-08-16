# Brain Rush — Reward Video + Compact Level UI

## This release

- Removed the old 3,000 score -> 3 coin conversion from the Home screen and coin engine.
- Added a clear coin-rules panel:
  - +10 coins for the first successful completion of a new level.
  - +100 coins for completing the reward video, once every 2 hours.
  - +30 coins for completing the 30,000-point daily challenge once per day.
- Added a small offline reward-video demo so the complete watch -> ended -> +100 coin -> 2-hour cooldown flow can be tested without an ad network.
- Added persistent reward-video cooldown.
- Home game-mode cards now show only three levels at a time:
  - 1–3 initially
  - 4–6 after Level 3 is completed
  - 7–9 after Level 6 is completed
  - 10 after Level 9 is completed
- Added coin earning guidance to the Daily Challenge page.
- Fixed settings row alignment for Haptic Feedback and Reset Progress on narrow screens.
- Kept pages lazy-loaded and the existing mobile performance optimizations.
- Added `REWARDED_AD_SETUP.md` explaining the production Google AdMob Rewarded Ads integration.

## Build status

The source/configuration was statically checked in this environment, but a full Angular build was not run because npm/Node tooling was unavailable in the execution environment. On Windows run:

```powershell
npm ci
ng build
```

Then:

```powershell
npx cap sync android
```

## Ad network note

The included MP4 is a local demo video, not a Google ad. For a production APK, use Google AdMob Rewarded Ads and credit the 100-coin reward only from the verified rewarded-ad completion callback.
