import { Injectable, signal } from '@angular/core';

/**
 * Tracks whether the device currently has a network connection. Ad revenue
 * funds this app's economy, so gameplay is blocked while offline (full-screen
 * message, no partial functionality) rather than letting the player earn
 * coins with no ad ever having been requested or shown.
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly _online = signal<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);
  get online(): boolean { return this._online(); }

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', () => { this._online.set(true); });
    window.addEventListener('offline', () => { this._online.set(false); });
  }

  /** Re-reads the browser's connectivity flag directly, for a manual "Try again" action. */
  recheck(): void {
    if (typeof navigator !== 'undefined') this._online.set(navigator.onLine);
  }
}
