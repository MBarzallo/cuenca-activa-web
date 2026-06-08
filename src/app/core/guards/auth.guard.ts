import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthSessionService } from '../auth/auth-session.service';

export const authGuard: CanMatchFn = async (route, segments): Promise<boolean | UrlTree> => {
  const session = inject(AuthSessionService);
  const router = inject(Router);

  const returnUrl = segments ? `/${segments.map((s) => s.path).join('/')}` : '';
  const redirectUrlTree = (target: string) => {
    return router.createUrlTree([target], {
      queryParams: returnUrl ? { returnUrl } : undefined,
    });
  };

  if (!session.user()) {
    try {
      await session.loadCurrentUser();
    } catch (error) {
      if (session.isMissingProfileError(error)) {
        return router.createUrlTree(['/completar-perfil']);
      }
      return redirectUrlTree('/login');
    }
  }

  return session.isAuthenticated() ? true : redirectUrlTree('/login');
};

