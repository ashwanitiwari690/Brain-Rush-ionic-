import { Injectable } from '@angular/core';
import { AdmobService } from './admob.service';

/**
 * App-facing entry point for every "watch an ad" reward placement (earn
 * coins, double coins, claim an achievement, continue after losing, etc).
 * Every page calls `watch()` instead of AdmobService directly, which gives
 * two guarantees app-wide:
 *
 * 1. Only one rewarded ad can be in flight at a time, no matter which
 *    placement triggered it — a second tap anywhere while one is showing
 *    resolves false instead of stacking a second ad request.
 * 2. On web/dev builds (no native AdMob available) it simulates a short
 *    "watch" delay instead of always failing, so every reward flow's UI can
 *    be exercised without a device. This simulated path NEVER runs on
 *    native — AdmobService.isSupported gates that — so it can never be
 *    mistaken for a real, monetized ad view.
 */
@Injectable({ providedIn: 'root' })
export class RewardAdService {
  private showing = false;

  constructor(private admob: AdmobService) {}

  /** True when this device can show real AdMob ads (native Android/iOS). */
  get usesNativeAds(): boolean {
    return this.admob.isSupported;
  }

  /**
   * Shows a rewarded ad and resolves true only when the reward is confirmed
   * (or, on web/dev, once the simulated watch completes). Resolves false
   * immediately if another rewarded ad is already showing anywhere in the app.
   */
  async watch(): Promise<boolean> {
    if (this.showing) return false;
    this.showing = true;
    try {
      if (this.admob.isSupported) {
        return await this.admob.showRewarded();
      }
      // Web/dev fallback so the reward flow is testable without a device.
      await new Promise<void>(resolve => setTimeout(resolve, 1500));
      return true;
    } finally {
      this.showing = false;
    }
  }
}
