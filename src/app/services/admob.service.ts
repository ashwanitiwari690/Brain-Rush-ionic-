import { Injectable } from '@angular/core';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { AdMob, RewardAdPluginEvents, AdmobConsentStatus } from '@capacitor-community/admob';
import { AD_UNIT_IDS, ADMOB_CONFIG, INTERSTITIAL_EVERY_N_ROUNDS } from '../config/admob.config';

/**
 * Service managing Google AdMob ad lifecycles and Google UMP Consent Management.
 * Complies with Google Play & AdMob European Economic Area (EEA) / UK regulations (TCF v2.2).
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
   * or unavailable ad never blocks navigation. Returns true only if an ad was shown.
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
