import { Injectable } from '@angular/core';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import { AD_UNIT_IDS, INTERSTITIAL_EVERY_N_ROUNDS } from '../config/admob.config';

/**
 * Thin wrapper around @capacitor-community/admob — the only file that talks
 * to the plugin directly; every page/service goes through this one instead.
 * Ads only run on native platforms; the plugin's web implementation is a
 * stub, so callers must never grant a reward based on it directly (see
 * RewardAdService for the web/dev-safe fallback used by the UI).
 */
@Injectable({ providedIn: 'root' })
export class AdmobService {
  readonly isSupported = Capacitor.isNativePlatform();

  private initPromise?: Promise<void>;

  private interstitialReady = false;
  private interstitialLoading = false;
  private interstitialShowing = false;
  private roundsSinceInterstitial = 0;

  private rewardedReady = false;
  private rewardedLoading = false;
  private rewardedShowing = false;

  initialize(): Promise<void> {
    if (!this.isSupported) return Promise.resolve();
    if (!this.initPromise) {
      this.initPromise = AdMob.initialize({ initializeForTesting: true })
        .then(() => {
          void this.preloadInterstitial();
          void this.preloadRewarded();
        })
        .catch(() => {});
    }
    return this.initPromise;
  }

  /** Preloads (or reloads) the interstitial in the background. */
  async preloadInterstitial(): Promise<void> {
    if (!this.isSupported || this.interstitialReady || this.interstitialLoading) return;
    this.interstitialLoading = true;
    try {
      await AdMob.prepareInterstitial({ adId: AD_UNIT_IDS.interstitial });
      this.interstitialReady = true;
    } catch {
      this.interstitialReady = false;
    } finally {
      this.interstitialLoading = false;
    }
  }

  /**
   * Call at a natural breakpoint (e.g. leaving a finished game round). Shows
   * an interstitial only every INTERSTITIAL_EVERY_N_ROUNDS calls, so ads stay
   * frequent without breaching AdMob's full-screen-ad frequency policies.
   */
  async maybeShowInterstitialAtBreakpoint(): Promise<void> {
    if (!this.isSupported) return;
    this.roundsSinceInterstitial++;
    if (this.roundsSinceInterstitial < INTERSTITIAL_EVERY_N_ROUNDS) return;
    this.roundsSinceInterstitial = 0;
    await this.showInterstitial();
  }

  /**
   * Shows the interstitial if one is ready (or can be loaded within a short
   * timeout) and resolves once it's dismissed. Gives up after ~4s so a slow
   * or unavailable ad never blocks whatever navigation it's gating. Returns
   * true only if an ad was actually shown. Re-entrant calls while one is
   * already showing resolve false immediately instead of stacking requests.
   */
  async showInterstitial(): Promise<boolean> {
    if (!this.isSupported || this.interstitialShowing) return false;
    this.interstitialShowing = true;
    try {
      await this.initialize();
      if (!this.interstitialReady) {
        await Promise.race([
          this.preloadInterstitial(),
          new Promise<void>(resolve => setTimeout(resolve, 4000))
        ]);
      }
      if (!this.interstitialReady) return false;
      this.interstitialReady = false;
      try {
        await AdMob.showInterstitial();
        void this.preloadInterstitial();
        return true;
      } catch {
        void this.preloadInterstitial();
        return false;
      }
    } finally {
      this.interstitialShowing = false;
    }
  }

  /** Preloads (or reloads) the rewarded video in the background. */
  async preloadRewarded(): Promise<void> {
    if (!this.isSupported || this.rewardedReady || this.rewardedLoading) return;
    this.rewardedLoading = true;
    try {
      await AdMob.prepareRewardVideoAd({ adId: AD_UNIT_IDS.rewarded });
      this.rewardedReady = true;
    } catch {
      this.rewardedReady = false;
    } finally {
      this.rewardedLoading = false;
    }
  }

  /**
   * Shows the rewarded video and resolves true ONLY when AdMob's own
   * OnUserEarnedReward callback fires. Never resolves true optimistically —
   * closing the ad early (Dismissed), a show failure, or an ad already in
   * flight (re-entrant call) all resolve false. This is the one method every
   * coin/unlock grant in the app must gate on.
   */
  async showRewarded(): Promise<boolean> {
    if (!this.isSupported || this.rewardedShowing) return false;
    this.rewardedShowing = true;

    await this.initialize();
    if (!this.rewardedReady) await this.preloadRewarded();
    if (!this.rewardedReady) {
      this.rewardedShowing = false;
      return false;
    }
    this.rewardedReady = false;

    return new Promise<boolean>(resolve => {
      let settled = false;
      const handles: Promise<PluginListenerHandle>[] = [];
      const cleanup = () => handles.forEach(h => h.then(handle => handle.remove()).catch(() => {}));
      const finish = (granted: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        this.rewardedShowing = false;
        void this.preloadRewarded();
        resolve(granted);
      };

      // showRewardVideoAd()'s promise only resolves via AdMob's own reward
      // callback — if the user closes the ad early, it never resolves on its
      // own, so we race it against the Dismissed/FailedToShow events too.
      handles.push(AdMob.addListener(RewardAdPluginEvents.Dismissed, () => finish(false)));
      handles.push(AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => finish(false)));

      AdMob.showRewardVideoAd()
        .then(() => finish(true))
        .catch(() => finish(false));
    });
  }
}
