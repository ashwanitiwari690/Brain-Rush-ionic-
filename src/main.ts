import { bootstrapApplication } from '@angular/platform-browser';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideRouter, withPreloading } from '@angular/router';
import { AppComponent } from './app/app.component';
import { IdlePreloadingStrategy, routes } from './app/app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

bootstrapApplication(AppComponent, {
  providers: [provideIonicAngular(), provideRouter(routes, withPreloading(IdlePreloadingStrategy)), provideAnimationsAsync()]
}).catch(err => console.error(err));
