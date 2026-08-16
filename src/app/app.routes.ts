import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route, Routes } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IdlePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (!route.loadComponent) return of(null);
    const idle = (window as any).requestIdleCallback as ((cb: () => void, options?: { timeout: number }) => number) | undefined;
    return new Observable(subscriber => {
      const start = () => {
        const subscription = load().subscribe({
          next: value => subscriber.next(value),
          error: error => subscriber.error(error),
          complete: () => subscriber.complete()
        });
        return () => subscription.unsubscribe();
      };
      let cleanup: (() => void) | undefined;
      if (idle) {
        const id = idle(start, { timeout: 2500 });
        cleanup = () => (window as any).cancelIdleCallback?.(id);
      } else {
        const timer = window.setTimeout(start, 1200);
        cleanup = () => window.clearTimeout(timer);
      }
      return () => cleanup?.();
    });
  }
}


export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'welcome' },
  { path: 'welcome', loadComponent: () => import('./pages/welcome/welcome.page').then(m => m.WelcomePage) },
  { path: 'home', loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage) },
  { path: 'game', loadComponent: () => import('./pages/game/game.page').then(m => m.GamePage) },
  { path: 'result', loadComponent: () => import('./pages/result/result.page').then(m => m.ResultPage) },
  { path: 'leaderboard', loadComponent: () => import('./pages/leaderboard/leaderboard.page').then(m => m.LeaderboardPage) },
  { path: 'profile', loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage) },
  { path: 'achievements', loadComponent: () => import('./pages/achievements/achievements.page').then(m => m.AchievementsPage) },
  { path: 'daily-challenge', loadComponent: () => import('./pages/daily-challenge/daily-challenge.page').then(m => m.DailyChallengePage) },
  { path: 'settings', loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage) },
  { path: '**', redirectTo: 'welcome' }
];
