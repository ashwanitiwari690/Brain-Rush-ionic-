import { Injectable } from '@angular/core';
import { AdmobService } from './admob.service';
import { AdmobLogger } from './admob-logger';

/**
 * App-facing entry point for every "watch an ad" reward placement (earn
 * coins, double coins, claim an achievement, continue after losing, etc).
 * Every page calls `watch()` instead of AdmobService directly, providing:
 *
 * 1. Single in-flight guarantee: Concurrent taps share the exact same
 *    active ad request rather than rejecting or stacking multiple ad sessions.
 * 2. Guaranteed reward verification: The promise resolves true ONLY when
 *    AdMob's official reward verification event has been received and the ad closed.
 * 3. Safe fallback on non-native environments (browser/dev) for UI testing without device.
 */
@Injectable({ providedIn: 'root' })
export class RewardAdService {
  private inFlightWatch?: Promise<boolean>;

  constructor(private admob: AdmobService) {}

  /** True when this device can show real AdMob ads (native Android/iOS). */
  get usesNativeAds(): boolean {
    return this.admob.isSupported;
  }

  /**
   * Shows a rewarded ad and resolves true only when the reward is confirmed
   * by AdMob. Concurrent taps join the active in-flight request rather than failing.
   */
  async watch(): Promise<boolean> {
    if (this.inFlightWatch) {
      AdmobLogger.log('rewarded', 'Joining existing in-flight rewarded ad request');
      return this.inFlightWatch;
    }

    this.inFlightWatch = (async () => {
      try {
        if (this.admob.isSupported) {
          return await this.admob.showRewarded();
        }
        // Web/dev fallback so the reward flow is testable without a device.
        AdmobLogger.log('rewarded', 'Simulating rewarded ad watch in web/dev environment');
        await new Promise<void>(resolve => setTimeout(resolve, 1500));
        return true;
      } finally {
        this.inFlightWatch = undefined;
      }
    })();

    return this.inFlightWatch;
  }
}
