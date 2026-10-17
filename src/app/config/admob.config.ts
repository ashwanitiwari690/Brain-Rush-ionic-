/**
 * AdMob Configuration for Brain Rush.
 *
 * Google AdMob Policy Guidelines:
 * 1. While testing or before Google Play release, keep `isTesting: true` to avoid
 *    invalid traffic strikes on your AdMob account.
 * 2. When releasing to production, set `isTesting: false` and fill in your real
 *    Ad Unit IDs created in https://apps.admob.com.
 * 3. Also make sure to update your AdMob App ID in `scripts/prepare-android.mjs`
 *    and `android/app/src/main/res/values/strings.xml`.
 */

export const ADMOB_CONFIG = {
  // Set to false when deploying with your live production AdMob units
  isTesting: false,

  // Google's official sample ad unit IDs (safe to test with on any device)
  testAdUnits: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917'
  },

  // Replace these with your real AdMob Ad Unit IDs from https://apps.admob.com
  productionAdUnits: {
    banner: 'ca-app-pub-2030586584805301/9281247114',
    interstitial: 'ca-app-pub-2030586584805301/2224884172',
    rewarded: 'ca-app-pub-2030586584805301/5066669936'
  },

  /** Optional: Test Device IDs for AdMob (avoids invalid clicks during internal testing) */
  testDeviceIds: [] as string[]
} as const;

export const AD_UNIT_IDS = ADMOB_CONFIG.isTesting
  ? ADMOB_CONFIG.testAdUnits
  : ADMOB_CONFIG.productionAdUnits;

/** Show interstitials at most once every N completed game rounds (policy-safe pacing). */
export const INTERSTITIAL_EVERY_N_ROUNDS = 3;

/** Minimum time (in milliseconds) between any two interstitial ads (prevents ad spam). */
export const INTERSTITIAL_COOLDOWN_MS = 90_000; // 90 seconds

/** Minimum time (in milliseconds) after a rewarded ad before showing an interstitial (prevents double-ad fatigue). */
export const REWARDED_SUPPRESS_INTERSTITIAL_MS = 90_000; // 90 seconds
