meService`; pages cannot directly assign to the balance.

## Reward video / Google ads

The ZIP includes a tiny local demo reward video at `src/assets/reward-demo.mp4` so the full reward flow can be tested offline. The coin is credited only from the video's `ended` event and a two-hour cooldown is stored persistently.

For the production APK, replace the demo video callback with a verified **Google AdMob Rewarded Ad** completion callback. Google AdSense is intended for web advertising; rewarded video in a native Android APK should use Google AdMob/Google Mobile Ads. The client-side prototype still needs a backend before coins have real monetary value.

