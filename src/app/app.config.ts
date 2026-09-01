import {
  ApplicationConfig,
  APP_INITIALIZER,
  inject,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { SyncService } from './core/services/sync.service';

function initSync(): () => Promise<void> {
  const sync = inject(SyncService);
  return () => sync.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: initSync,
      multi: true,
    },
  ],
};
