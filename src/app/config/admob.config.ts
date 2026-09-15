/**
 * AdMob ad unit configuration — the single source of truth for every ad
 * unit ID the app requests. Every page/service reads IDs from here through
 * `AdmobService`; nothing else should hardcode an ad unit ID.
 *
 * The IDs below are Google's official sample ad unit IDs — they always serve
 * a clearly labeled "Test Ad" and are safe to ship during development (real
 * ad unit IDs requested from an app that isn't approved/live yet can get an
 * AdMob account flagged for invalid traffic).
 * See https://developers.google.com/admob/android/test-ads
 *
 * Going live later is a one-line-per-format swap in this file: create real
 * ad units in the AdMob console for this app's real AdMob App ID (see
 * android/app/src/main/res/values/strings.xml) and paste their IDs in below.
 */
export const AD_UNIT_IDS = {
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917'
} as const;

/** Show interstitials at most once every N completed game rounds (policy-safe pacing). */
export const INTERSTITIAL_EVERY_N_ROUNDS = 2;
