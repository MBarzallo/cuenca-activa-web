import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthSessionService } from '../auth/auth-session.service';

export const authGuard: CanMatchFn = async (): Promise<boolean | UrlTree> => {
  const session = inject(AuthSessionService);
  const router = inject(Router);

  if (!session.user()) {
    try {
      await session.loadCurrentUser();
    } catch (error) {
      if (session.isMissingProfileError(error)) {
        return router.createUrlTree(['/completar-perfil']);
      }
      return router.createUrlTree(['/login']);
    }
  }

  return session.isAuthenticated() ? true : router.createUrlTree(['/login']);
};
