import { Injectable } from '@angular/core';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import {
  AdMob,
  AdMobError,
  AdmobConsentStatus,
  AdMobRewardItem,
  BannerAdOptions,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents
} from '@capacitor-community/admob';
import {
  AD_UNIT_IDS,
  ADMOB_CONFIG,
  INTERSTITIAL_EVERY_N_ROUNDS,
  INTERSTITIAL_COOLDOWN_MS,
  REWARDED_SUPPRESS_INTERSTITIAL_MS
} from '../config/admob.config';
import { AudioService } from './audio.service';
import { AdmobLogger } from './admob-logger';

/**
 * Service managing Google AdMob ad lifecycles, placement pacing,
 * and Google UMP Consent Management (TCF v2.2 compliant).
 */
@Injectable({ providedIn: 'root' })
export class AdmobService {
  readonly isSupported = Capacitor.isNativePlatform();

  private initPromise?: Promise<void>;

  // Banner state
  private bannerVisible = false;
  private bannerCreated = false;
  private bannerListenersInitialized = false;

  // Interstitial state & pacing
  private interstitialReady = false;
  private interstitialShowing = false;
  private interstitialLoadPromise?: Promise<boolean>;
  private interstitialRetryCount = 0;
  private interstitialRetryTimeout?: ReturnType<typeof setTimeout>;
  private roundsSinceInterstitial = 0;
  private lastInterstitialTime = 0;

  // Rewarded state & pacing
  private rewardedReady = false;
  private rewardedShowing = false;
  private rewardedLoadPromise?: Promise<boolean>;
  private rewardedRetryCount = 0;
  private rewardedRetryTimeout?: ReturnType<typeof setTimeout>;
  private lastRewardedTime = 0;

  constructor(private audio: AudioService) {}

  /** True when any full-screen ad (interstitial or rewarded) is covering the screen. */
  get isFullScreenAdShowing(): boolean {
    return this.interstitialShowing || this.rewardedShowing;
  }

  // ---------------------------------------------------------------------
  // SDK Initialization & Consent
  // ---------------------------------------------------------------------

  initialize(): Promise<void> {
    if (!this.isSupported) return Promise.resolve();
    if (!this.initPromise) {
      this.initPromise = this.requestConsentAndInit();
    }
    return this.initPromise;
  }

  /**
   * Request Google UMP user consent (required in EEA & UK) before initializing AdMob.
   * If consent is required, displays the official Google consent dialog automatically.
   */
  private async requestConsentAndInit(): Promise<void> {
    AdmobLogger.log('init', 'Starting Google Mobile Ads & UMP Consent initialization');

    try {
      const consentInfo = await AdMob.requestConsentInfo({
        tagForUnderAgeOfConsent: false,
        testDeviceIdentifiers: ADMOB_CONFIG.testDeviceIds.length ? [...ADMOB_CONFIG.testDeviceIds] : undefined
      });

      AdmobLogger.log('consent', `UMP consent status: ${consentInfo.status}, form available: ${consentInfo.isConsentFormAvailable}`);

      if (consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
        AdmobLogger.log('consent', 'Displaying required UMP consent form');
        await AdMob.showConsentForm();
      }
    } catch (e) {
      AdmobLogger.warn('consent', 'UMP consent check bypassed or not applicable in this region', e);
    }

    try {
      await AdMob.initialize({
        initializeForTesting: ADMOB_CONFIG.isTesting,
        testingDevices: ADMOB_CONFIG.testDeviceIds.length ? [...ADMOB_CONFIG.testDeviceIds] : undefined
      });
      AdmobLogger.log('init', `AdMob SDK initialized successfully (testing=${ADMOB_CONFIG.isTesting})`);

      // Preload full-screen ads in background so they are ready for natural transition points
      void this.preloadInterstitial();
      void this.preloadRewarded();
    } catch (err) {
      AdmobLogger.error('init', 'Failed to initialize AdMob SDK', err);
    }
  }

  /**
   * Shows the Google Privacy Options Form so users can review or change consent
   * at any time from Settings (required by Google AdMob EU policy).
   */
  async showPrivacyOptions(): Promise<boolean> {
    if (!this.isSupported) return false;
    try {
      await AdMob.showPrivacyOptionsForm();
      AdmobLogger.log('consent', 'showPrivacyOptionsForm presented successfully');
      return true;
    } catch (error) {
      AdmobLogger.warn('consent', 'showPrivacyOptionsForm not required or failed', error);
      return false;
    }
  }

  // ---------------------------------------------------------------------
  // Banner Ad Implementation
  // ---------------------------------------------------------------------

  /** Shows the persistent banner at the bottom. Safe to call repeatedly across routes. */
  async showBanner(): Promise<void> {
    if (!this.isSupported) return;
    if (this.bannerVisible || this.isFullScreenAdShowing) return;

    await this.initialize();

    if (!this.bannerListenersInitialized) {
      this.bannerListenersInitialized = true;

      void AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info) => {
        AdmobLogger.log('banner', `BannerAdPluginEvents.SizeChanged: height=${info.height}`);
        if (info.height > 0) {
          this.setBannerSpace(info.height);
          this.bannerVisible = true;
        } else {
          this.setBannerSpace(0);
          this.bannerVisible = false;
        }
      });

      void AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (err: AdMobError) => {
        AdmobLogger.warn('banner', `BannerAdPluginEvents.FailedToLoad code=${err?.code} message=${err?.message}`);
        this.bannerVisible = false;
        this.setBannerSpace(0);
      });

      void AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
        AdmobLogger.log('banner', 'BannerAdPluginEvents.Loaded');
        this.bannerVisible = true;
      });
    }

    if (this.bannerCreated) {
      try {
        await AdMob.resumeBanner();
        this.bannerVisible = true;
        AdmobLogger.log('banner', 'Resumed existing banner');
        return;
      } catch (err) {
        AdmobLogger.warn('banner', 'resumeBanner failed; recreating fresh banner', err);
        this.bannerCreated = false;
      }
    }

    const options: BannerAdOptions = {
      adId: AD_UNIT_IDS.banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0
    };

    try {
      AdmobLogger.log('banner', `Requesting showBanner with adUnitId=${options.adId}`);
      await AdMob.showBanner(options);
      this.bannerCreated = true;
      this.bannerVisible = true;
    } catch (err) {
      AdmobLogger.error('banner', 'showBanner failed', err);
      this.bannerCreated = false;
      this.bannerVisible = false;
      this.setBannerSpace(0);
    }
  }

  /** Hides the banner (e.g. entering live gameplay, or going offline). */
  async hideBanner(): Promise<void> {
    this.bannerVisible = false;
    this.setBannerSpace(0);
    if (!this.isSupported) return;
    try {
      await AdMob.hideBanner();
      AdmobLogger.log('banner', 'Banner hidden');
    } catch (err) {
      AdmobLogger.warn('banner', 'hideBanner error (safe to ignore)', err);
    }
  }

  /** Exposes the banner's live height as CSS vars so bottom-nav and page spacers adjust cleanly. */
  private setBannerSpace(heightPx: number): void {
    const raw = Math.max(0, heightPx);
    // Standard mobile adaptive banner is 50-60dp. If raw > 90, it is in physical device pixels: convert to CSS pixels.
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    const space = raw > 90 ? Math.round(raw / dpr) : raw;

    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--ad-banner-space', `${space}px`);
      if (space > 0) {
        document.body.classList.add('has-ad-banner');
      } else {
        document.body.classList.remove('has-ad-banner');
      }
    }
  }

  // ---------------------------------------------------------------------
  // Interstitial Ad Implementation
  // ---------------------------------------------------------------------

  /** Preloads (or reloads) the interstitial in the background. */
  async preloadInterstitial(): Promise<boolean> {
    if (!this.isSupported) return false;
    if (this.interstitialReady) return true;
    if (this.interstitialLoadPromise) return this.interstitialLoadPromise;

    this.interstitialLoadPromise = (async () => {
      try {
        AdmobLogger.log('interstitial', `Preparing interstitial with adUnitId=${AD_UNIT_IDS.interstitial}`);
        await AdMob.prepareInterstitial({ adId: AD_UNIT_IDS.interstitial });
        this.interstitialReady = true;
        this.interstitialRetryCount = 0;
        AdmobLogger.log('interstitial', 'Interstitial ad preloaded and ready');
        return true;
      } catch (err) {
        this.interstitialReady = false;
        AdmobLogger.warn('interstitial', 'Failed to preload interstitial ad', err);
        this.scheduleInterstitialRetry();
        return false;
      } finally {
        this.interstitialLoadPromise = undefined;
      }
    })();

    return this.interstitialLoadPromise;
  }

  private scheduleInterstitialRetry(): void {
    if (this.interstitialRetryCount >= 3) {
      AdmobLogger.warn('interstitial', 'Max interstitial preload retry attempts reached (3). Waiting for next game session.');
      return;
    }
    this.interstitialRetryCount++;
    const delayMs = Math.pow(3, this.interstitialRetryCount) * 1500; // ~4.5s, ~13.5s, ~40.5s
    AdmobLogger.log('interstitial', `Scheduling interstitial retry #${this.interstitialRetryCount} in ${delayMs}ms`);
    if (this.interstitialRetryTimeout) clearTimeout(this.interstitialRetryTimeout);
    this.interstitialRetryTimeout = setTimeout(() => {
      void this.preloadInterstitial();
    }, delayMs);
  }

  /**
   * Evaluates natural transition breakpoint:
   * 1. No rewarded ad was watched recently (within REWARDED_SUPPRESS_INTERSTITIAL_MS).
   * 2. Enough time has elapsed since the last interstitial (INTERSTITIAL_COOLDOWN_MS).
   * 3. Exactly INTERSTITIAL_EVERY_N_ROUNDS completed rounds have elapsed.
   */
  async maybeShowInterstitialAtBreakpoint(): Promise<boolean> {
    if (!this.isSupported) return false;

    // Suppress if player recently watched a rewarded video
    if (this.lastRewardedTime > 0 && Date.now() - this.lastRewardedTime < REWARDED_SUPPRESS_INTERSTITIAL_MS) {
      AdmobLogger.log('interstitial', 'Pacing: Interstitial suppressed due to recent rewarded ad completion');
      return false;
    }

    // Minimum cooldown time between any two interstitials
    if (this.lastInterstitialTime > 0 && Date.now() - this.lastInterstitialTime < INTERSTITIAL_COOLDOWN_MS) {
      AdmobLogger.log('interstitial', 'Pacing: Interstitial suppressed due to cooldown timer');
      return false;
    }

    // Pacing: only show every N completed rounds
    this.roundsSinceInterstitial++;
    AdmobLogger.log('interstitial', `Round count towards interstitial: ${this.roundsSinceInterstitial}/${INTERSTITIAL_EVERY_N_ROUNDS}`);
    if (this.roundsSinceInterstitial < INTERSTITIAL_EVERY_N_ROUNDS) return false;

    this.roundsSinceInterstitial = 0;
    return await this.showInterstitial();
  }

  /**
   * Shows the interstitial and resolves ONLY once dismissed by the user.
   * Prevents premature page navigation behind the active advertisement.
   */
  async showInterstitial(): Promise<boolean> {
    if (!this.isSupported || this.interstitialShowing) return false;
    this.interstitialShowing = true;

    try {
      await this.initialize();

      // If not yet ready, allow in-flight preload up to 5 seconds
      if (!this.interstitialReady) {
        AdmobLogger.log('interstitial', 'Ad not preloaded; attempting quick load with timeout');
        await Promise.race([
          this.preloadInterstitial(),
          new Promise<void>(resolve => setTimeout(resolve, 5000))
        ]);
      }

      if (!this.interstitialReady) {
        AdmobLogger.warn('interstitial', 'Interstitial ad unavailable; skipping display without interrupting player');
        this.interstitialShowing = false;
        return false;
      }
      this.interstitialReady = false;

      // Pause background music before presenting full-screen ad
      this.audio.pauseForAd();

      return await new Promise<boolean>((resolve) => {
        let settled = false;
        const handles: Promise<PluginListenerHandle>[] = [];

        const cleanup = () => {
          handles.forEach(h => h.then(handle => handle.remove()).catch(() => {}));
        };

        const finish = (shown: boolean) => {
          if (settled) return;
          settled = true;
          cleanup();
          this.interstitialShowing = false;
          if (shown) {
            this.lastInterstitialTime = Date.now();
            AdmobLogger.log('interstitial', 'Interstitial closed; proceeding to game transition');
          }
          this.audio.resumeAfterAd();
          void this.preloadInterstitial();
          resolve(shown);
        };

        handles.push(AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
          AdmobLogger.log('interstitial', 'InterstitialAdPluginEvents.Dismissed received');
          finish(true);
        }));

        handles.push(AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (err: AdMobError) => {
          AdmobLogger.warn('interstitial', `InterstitialAdPluginEvents.FailedToShow: ${err?.message}`);
          finish(false);
        }));

        AdMob.showInterstitial()
          .catch((err) => {
            AdmobLogger.error('interstitial', 'AdMob.showInterstitial error', err);
            finish(false);
          });

        // 60-second safety fallback
        setTimeout(() => {
          if (!settled) {
            AdmobLogger.warn('interstitial', 'Interstitial session safety timeout triggered');
            finish(false);
          }
        }, 60_000);
      });
    } catch (err) {
      AdmobLogger.error('interstitial', 'showInterstitial outer exception', err);
      this.interstitialShowing = false;
      this.audio.resumeAfterAd();
      return false;
    }
  }

  // ---------------------------------------------------------------------
  // Rewarded Ad Implementation
  // ---------------------------------------------------------------------

  /** Preloads (or reloads) the rewarded video in the background. */
  async preloadRewarded(): Promise<boolean> {
    if (!this.isSupported) return false;
    if (this.rewardedReady) return true;
    if (this.rewardedLoadPromise) return this.rewardedLoadPromise;

    this.rewardedLoadPromise = (async () => {
      try {
        AdmobLogger.log('rewarded', `Preparing rewarded ad with adUnitId=${AD_UNIT_IDS.rewarded}`);
        await AdMob.prepareRewardVideoAd({ adId: AD_UNIT_IDS.rewarded });
        this.rewardedReady = true;
        this.rewardedRetryCount = 0;
        AdmobLogger.log('rewarded', 'Rewarded ad preloaded and ready');
        return true;
      } catch (err) {
        this.rewardedReady = false;
        AdmobLogger.warn('rewarded', 'Failed to preload rewarded ad', err);
        this.scheduleRewardedRetry();
        return false;
      } finally {
        this.rewardedLoadPromise = undefined;
      }
    })();

    return this.rewardedLoadPromise;
  }

  private scheduleRewardedRetry(): void {
    if (this.rewardedRetryCount >= 3) {
      AdmobLogger.warn('rewarded', 'Max rewarded preload retry attempts reached (3). Waiting for user interaction.');
      return;
    }
    this.rewardedRetryCount++;
    const delayMs = Math.pow(3, this.rewardedRetryCount) * 1500;
    AdmobLogger.log('rewarded', `Scheduling rewarded ad retry #${this.rewardedRetryCount} in ${delayMs}ms`);
    if (this.rewardedRetryTimeout) clearTimeout(this.rewardedRetryTimeout);
    this.rewardedRetryTimeout = setTimeout(() => {
      void this.preloadRewarded();
    }, delayMs);
  }

  /**
   * Shows the rewarded video. Resolves true ONLY when AdMob's official
   * OnUserEarnedReward callback has verified reward completion AND the ad is dismissed.
   */
  async showRewarded(): Promise<boolean> {
    if (!this.isSupported || this.rewardedShowing) return false;
    this.rewardedShowing = true;

    try {
      await this.initialize();

      // If not yet ready, wait for active in-flight preload (up to 6 seconds)
      if (!this.rewardedReady) {
        AdmobLogger.log('rewarded', 'Rewarded ad not preloaded; awaiting in-flight load with timeout');
        await Promise.race([
          this.preloadRewarded(),
          new Promise<void>(resolve => setTimeout(resolve, 6000))
        ]);
      }

      if (!this.rewardedReady) {
        AdmobLogger.warn('rewarded', 'Rewarded ad unavailable');
        this.rewardedShowing = false;
        return false;
      }
      this.rewardedReady = false;

      // Pause audio before presenting ad
      this.audio.pauseForAd();

      return await new Promise<boolean>((resolve) => {
        let settled = false;
        let rewardEarned = false;
        const handles: Promise<PluginListenerHandle>[] = [];

        const cleanup = () => {
          handles.forEach(h => h.then(handle => handle.remove()).catch(() => {}));
        };

        const finish = (granted: boolean) => {
          if (settled) return;
          settled = true;
          cleanup();
          this.rewardedShowing = false;
          if (granted) {
            this.lastRewardedTime = Date.now();
            AdmobLogger.log('rewarded', 'User earned reward confirmed and ad dismissed');
          } else {
            AdmobLogger.log('rewarded', 'Rewarded ad dismissed without reward or failed to show');
          }
          this.audio.resumeAfterAd();
          void this.preloadRewarded();
          resolve(granted);
        };

        // Listen for the official reward event
        handles.push(AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
          rewardEarned = true;
          AdmobLogger.log('rewarded', 'RewardAdPluginEvents.Rewarded verified', reward);
        }));

        // Ad dismissed: this is when the user returns to the game screen
        handles.push(AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          AdmobLogger.log('rewarded', `RewardAdPluginEvents.Dismissed, rewardEarned=${rewardEarned}`);
          finish(rewardEarned);
        }));

        // Presentation failure
        handles.push(AdMob.addListener(RewardAdPluginEvents.FailedToShow, (err: AdMobError) => {
          AdmobLogger.warn('rewarded', `RewardAdPluginEvents.FailedToShow: ${err?.message}`);
          finish(false);
        }));

        AdMob.showRewardVideoAd()
          .then((rewardItem: AdMobRewardItem) => {
            if (rewardItem) {
              rewardEarned = true;
              AdmobLogger.log('rewarded', 'showRewardVideoAd resolved with reward item', rewardItem);
            }
          })
          .catch((err) => {
            AdmobLogger.error('rewarded', 'AdMob.showRewardVideoAd error', err);
            finish(false);
          });

        // 5-minute safety timeout
        setTimeout(() => {
          if (!settled) {
            AdmobLogger.warn('rewarded', 'Rewarded ad session safety timeout triggered');
            finish(false);
          }
        }, 300_000);
      });
    } catch (err) {
      AdmobLogger.error('rewarded', 'showRewarded outer exception', err);
      this.rewardedShowing = false;
      this.audio.resumeAfterAd();
      return false;
    }
  }

  // ---------------------------------------------------------------------
  // Network Lifecycle
  // ---------------------------------------------------------------------

  /** Resets bounded retries and attempts background preloads when network returns. */
  onNetworkReconnected(): void {
    AdmobLogger.log('init', 'Network reconnected; resetting backoff and preloading ads');
    this.interstitialRetryCount = 0;
    this.rewardedRetryCount = 0;
    if (!this.interstitialReady) {
      void this.preloadInterstitial();
    }
    if (!this.rewardedReady) {
      void this.preloadRewarded();
    }
  }
}
