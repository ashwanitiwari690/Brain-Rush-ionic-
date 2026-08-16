# Rewarded Video Setup

## Current ZIP behavior

The app contains `src/assets/reward-demo.mp4` as a tiny offline demo so the earning flow can be tested without an ad network.

Rules:
- Reward: **100 coins**
- Reward is credited only after the video emits `ended`.
- A successful reward starts a **2-hour cooldown**.
- Refreshing/reopening the app keeps the cooldown.
- Reset Progress clears the stored wallet/cooldown because it resets the local demo state.

## Production Android

For an APK, use **Google AdMob Rewarded Ads** rather than Google AdSense rewarded video. The native rewarded-ad SDK provides a verified reward callback that should call the same central coin-credit method only after Google reports the ad was completed.

Do not credit coins from:
- a button click,
- a timer,
- a client-provided ad URL,
- or a video `currentTime` value.

For real-money redemption, the final coin credit must also be validated and recorded by your backend.
