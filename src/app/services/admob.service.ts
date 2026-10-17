import { Injectable } from '@angular/core';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import {
  AdMob,
  RewardAdPluginEvents,
  AdmobConsentStatus,
  BannerAdOptions,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize
} from '@capacitor-community/admob';
import {
  AD_UNIT_IDS,
  ADMOB_CONFIG,
  INTERSTITIAL_EVERY_N_ROUNDS,
  INTERSTITIAL_COOLDOWN_MS,
  REWARDED_SUPPRESS_INTERSTITIAL_MS
} from '../config/admob.config';

/**
 * Service managing Google AdMob ad lifecycles and Google UMP Consent Management.
 * Complies with Google Play & AdMob European Economic Area (EEA) / UK regulations (TCF v2.2).
 */
@Injectable({ providedIn: 'root' })
export class AdmobService {
  readonly isSupported = Capacitor.isNativePlatform();

  private initPromise?: Promise<void>;
  private bannerVisible = false;
  private bannerCreated = false;
  private bannerListenersInitialized = false;

  private interstitialReady = false;
  private interstitialLoading = false;
  private interstitialShowing = false;
  private roundsSinceInterstitial = 0;
  private lastInterstitialTime = 0;
  private lastRewardedTime = 0;

  private rewardedReady = false;
  private rewardedLoading = false;
  private rewardedShowing = false;

  // ---------------------------------------------------------------------
  // Banner
  // ---------------------------------------------------------------------

  /** Shows the persistent banner at the bottom. Safe to call repeatedly. */
  async showBanner(): Promise<void> {
    if (!this.isSupported) return;
    await this.initialize();
    if (this.bannerVisible) return;

    if (!this.bannerListenersInitialized) {
      this.bannerListenersInitialized = true;
      void AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info) => {
        if (info.height > 0) {
          this.setBannerSpace(info.height);
          this.bannerVisible = true;
        } else {
          this.setBannerSpace(0);
          this.bannerVisible = false;
        }
      });
      void AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
        this.bannerVisible = false;
        this.setBannerSpace(0);
      });
      void AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
        this.bannerVisible = true;
      });
    }

    if (this.bannerCreated) {
      try {
        await AdMob.resumeBanner();
        this.bannerVisible = true;
        return;
      } catch {
        // If native resume fails, recreate fresh below
        this.bannerCreated = false;
      }
    }

    const options: BannerAdOptions = {
      adId: AD_UNIT_IDS.banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    };
    try {
      await AdMob.showBanner(options);
      this.bannerCreated = true;
      this.bannerVisible = true;
    } catch {
      this.bannerVisible = false;
      this.setBannerSpace(0);
    }
  }

  /** Hides the persistent banner (e.g. entering gameplay, or going offline). */
  async hideBanner(): Promise<void> {
    this.bannerVisible = false;
    this.setBannerSpace(0);
    if (!this.isSupported) return;
    try {
      await AdMob.hideBanner();
    } catch {
      /* nothing to clean up */
    }
  }

  /** Exposes the banner's live height as CSS vars so bottom-nav and page spacers adjust seamlessly. */
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

  initialize(): Promise<void> {
    if (!this.isSupported) return Promise.resolve();
    if (!this.initPromise) {
      this.initPromise = this.requestConsentAndInit();
    }
    return this.initPromise;
  }

  /**
   * Request Google UMP user consent (required in EEA & UK) before initializing AdMob.
   * If consent is required, shows the Google consent dialogue automatically.
   */
  private async requestConsentAndInit(): Promise<void> {
    try {
      const consentInfo = await AdMob.requestConsentInfo();
      if (consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
        await AdMob.showConsentForm();
      }
    } catch (e) {
      console.debug('[admob] UMP consent request error or not applicable:', e);
    }

    try {
      await AdMob.initialize({
        initializeForTesting: ADMOB_CONFIG.isTesting,
        testingDevices: ADMOB_CONFIG.testDeviceIds.length ? [...ADMOB_CONFIG.testDeviceIds] : undefined
      });
      void this.preloadInterstitial();
      void this.preloadRewarded();
    } catch (err) {
      console.error('[admob] Failed to initialize AdMob SDK:', err);
    }
  }

  /**
   * Shows the Google Privacy Options Form so users can review or revoke consent
   * at any time from the app's settings menu (required by Google AdMob EU policy).
   */
  async showPrivacyOptions(): Promise<boolean> {
    if (!this.isSupported) return false;
    try {
      await AdMob.showPrivacyOptionsForm();
      return true;
    } catch (error) {
      console.debug('[admob] showPrivacyOptionsForm not required or failed:', error);
      return false;
    }
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
   * Call ONLY at a natural breakpoint (leaving a finished game round).
   * Shows an interstitial only when all policy-safe pacing conditions are met:
   * 1. No rewarded ad was watched recently (within REWARDED_SUPPRESS_INTERSTITIAL_MS).
   * 2. Enough time has elapsed since the last interstitial (INTERSTITIAL_COOLDOWN_MS).
   * 3. Exactly INTERSTITIAL_EVERY_N_ROUNDS completed rounds have elapsed.
   */
  async maybeShowInterstitialAtBreakpoint(): Promise<boolean> {
    if (!this.isSupported) return false;

    // Suppress if player recently watched a rewarded video (prevents double-ad fatigue)
    if (this.lastRewardedTime > 0 && Date.now() - this.lastRewardedTime < REWARDED_SUPPRESS_INTERSTITIAL_MS) {
      return false;
    }

    // Minimum cooldown time between any two interstitials
    if (this.lastInterstitialTime > 0 && Date.now() - this.lastInterstitialTime < INTERSTITIAL_COOLDOWN_MS) {
      return false;
    }

    // Pacing: only show every N completed rounds
    this.roundsSinceInterstitial++;
    if (this.roundsSinceInterstitial < INTERSTITIAL_EVERY_N_ROUNDS) return false;

    this.roundsSinceInterstitial = 0;
    return await this.showInterstitial();
  }

  /**
   * Shows the interstitial if one is ready and resolves once it's dismissed.
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
        this.lastInterstitialTime = Date.now();
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
   * OnUserEarnedReward callback fires.
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
        if (granted) {
          this.lastRewardedTime = Date.now();
        }
        void this.preloadRewarded();
        resolve(granted);
      };

      handles.push(AdMob.addListener(RewardAdPluginEvents.Dismissed, () => finish(false)));
      handles.push(AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => finish(false)));

      AdMob.showRewardVideoAd()
        .then(() => finish(true))
        .catch(() => finish(false));
    });
  }
}
