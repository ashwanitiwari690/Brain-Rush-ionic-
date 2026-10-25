/**
 * Structured diagnostic logger for Google AdMob integrations.
 * Formats lifecycle events for Banner, Interstitial, Rewarded, and Consent systems.
 * Never logs PII, device IDs, or user credentials.
 */
export class AdmobLogger {
  private static prefix(category: 'init' | 'banner' | 'interstitial' | 'rewarded' | 'consent'): string {
    return `[AdMob:${category.toUpperCase()}]`;
  }

  static log(category: 'init' | 'banner' | 'interstitial' | 'rewarded' | 'consent', message: string, data?: unknown): void {
    if (data !== undefined) {
      console.log(`${this.prefix(category)} ${message}`, data);
    } else {
      console.log(`${this.prefix(category)} ${message}`);
    }
  }

  static warn(category: 'init' | 'banner' | 'interstitial' | 'rewarded' | 'consent', message: string, data?: unknown): void {
    if (data !== undefined) {
      console.warn(`${this.prefix(category)} ⚠️ ${message}`, data);
    } else {
      console.warn(`${this.prefix(category)} ⚠️ ${message}`);
    }
  }

  static error(category: 'init' | 'banner' | 'interstitial' | 'rewarded' | 'consent', message: string, error?: unknown): void {
    if (error !== undefined) {
      console.error(`${this.prefix(category)} ❌ ${message}`, error);
    } else {
      console.error(`${this.prefix(category)} ❌ ${message}`);
    }
  }
}

