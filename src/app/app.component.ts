import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AudioService } from './services/audio.service';
import { AppVerificationService } from './services/app-verification.service';
import { AdmobService } from './services/admob.service';
import { ConnectivityService } from './services/connectivity.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet *ngIf="connectivity.online"></ion-router-outlet>
      <main class="page offline-page" *ngIf="!connectivity.online">
        <div class="shell offline-shell">
          <section class="card offline-card">
            <div class="offline-icon">📡</div>
            <h1>No Internet Connection</h1>
            <p>Brain Rush needs an internet connection to load ads and keep your rewards in sync. Please reconnect to keep playing.</p>
            <button class="btn primary" (click)="connectivity.recheck()">Try Again</button>
          </section>
        </div>
      </main>
    </ion-app>
  `,
  styles: [`
    :host{display:block;height:100%}
    .offline-page{height:100vh;display:flex;align-items:center;justify-content:center}
    .offline-shell{padding:24px;width:min(100%,420px)}
    .offline-card{width:100%;text-align:center;padding:34px 26px}
    .offline-icon{font-size:48px;margin-bottom:14px}
    .offline-card h1{font-size:20px;margin:0 0 10px}
    .offline-card p{color:var(--muted);font-size:13px;line-height:1.5;margin:0 0 20px}
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  private routerSub?: Subscription;

  private firstInteraction = () => {
    this.audio.unlock();
    window.removeEventListener('pointerdown', this.firstInteraction);
    window.removeEventListener('touchstart', this.firstInteraction);
    window.removeEventListener('keydown', this.firstInteraction);
  };

  private onConnectivityChange = () => {
    this.updateBannerVisibility();
  };

  private updateBannerVisibility(): void {
    if (!this.connectivity.online) {
      void this.admob.hideBanner();
      return;
    }
    const currentUrl = this.router.url.split('?')[0];
    if (currentUrl.startsWith('/game')) {
      void this.admob.hideBanner();
    } else {
      void this.admob.showBanner();
    }
  }

  constructor(
    private router: Router,
    private audio: AudioService,
    private appVerification: AppVerificationService,
    private admob: AdmobService,
    public connectivity: ConnectivityService
  ) {}

  ngOnInit(): void {
    // Fire-and-forget: confirms this device's App Promotion install to
    // Earnivo so a pending reward (if any) gets credited. Harmless no-op
    // otherwise — see APP_PROMOTION_VERIFICATION_INTEGRATION.md.
    void this.appVerification.confirmAppPromotion();

    void this.admob.initialize();

    // Persistent banner on every screen except live gameplay (/game), where it would
    // eat into the challenge tap area — and hidden while offline.
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateBannerVisibility();
      });

    window.addEventListener('online', this.onConnectivityChange);
    window.addEventListener('offline', this.onConnectivityChange);

    this.updateBannerVisibility();

    // Try immediately for native/webviews where autoplay is permitted.
    if (this.audio.musicEnabled) {
      this.audio.startMusic();
    }

    // For normal mobile browsers, Web Audio requires a user gesture.
    // The first interaction unlocks and starts the enabled music.
    window.addEventListener('pointerdown', this.firstInteraction, { passive: true });
    window.addEventListener('touchstart', this.firstInteraction, { passive: true });
    window.addEventListener('keydown', this.firstInteraction, { passive: true });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    window.removeEventListener('online', this.onConnectivityChange);
    window.removeEventListener('offline', this.onConnectivityChange);
    window.removeEventListener('pointerdown', this.firstInteraction);
    window.removeEventListener('touchstart', this.firstInteraction);
    window.removeEventListener('keydown', this.firstInteraction);
  }
}
