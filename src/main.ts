import { bootstrapApplication } from '@angular/platform-browser';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { IdlePreloadingStrategy, routes } from './app/app.routes';
bootstrapApplication(AppComponent, {
  providers: [
    provideIonicAngular({ mode: 'md' }),
    provideRouter(routes, withPreloading(IdlePreloadingStrategy)),
    provideHttpClient()
  ]
}).catch(err => console.error(err));
