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
  isTesting: true,

  // Google's official sample ad unit IDs (safe to test with on any device)
  testAdUnits: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917'
  },

  // Replace these with your real AdMob Ad Unit IDs from https://apps.admob.com
  productionAdUnits: {
    banner: 'ca-app-pub-3940256099942544/6300978111',       // Replace with your live Banner ID
    interstitial: 'ca-app-pub-3940256099942544/1033173712', // Replace with your live Interstitial ID
    rewarded: 'ca-app-pub-3940256099942544/5224354917'       // Replace with your live Rewarded ID
  },

  /** Optional: Test Device IDs for AdMob (avoids invalid clicks during internal testing) */
  testDeviceIds: [] as string[]
} as const;

export const AD_UNIT_IDS = ADMOB_CONFIG.isTesting
  ? ADMOB_CONFIG.testAdUnits
  : ADMOB_CONFIG.productionAdUnits;

/** Show interstitials at most once every N completed game rounds (policy-safe pacing). */
export const INTERSTITIAL_EVERY_N_ROUNDS = 2;
