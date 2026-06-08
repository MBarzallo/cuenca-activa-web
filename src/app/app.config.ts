import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';
import { loggingInterceptor } from './core/interceptors/logging.interceptor';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthSessionService } from './core/auth/auth-session.service';



export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),

    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authTokenInterceptor, loggingInterceptor])),
    MessageService,
    ConfirmationService,

    {
      provide: APP_INITIALIZER,
      useFactory: (session: AuthSessionService) => () => session.loadCurrentUser(),
      deps: [AuthSessionService],
      multi: true
    },

    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.ca-dark'
        }
      },
      ripple: true
    })
  ]
};
