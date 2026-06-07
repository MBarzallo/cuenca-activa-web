import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { ADMIN_ROLES, AppRole } from '../models/auth-user.model';
import { AuthSessionService } from '../auth/auth-session.service';

export const roleGuard: CanMatchFn = async (
  route: Route,
  _segments: UrlSegment[],
): Promise<boolean | UrlTree> => {
  const session = inject(AuthSessionService);
  const router = inject(Router);
  const allowedRoles = (route.data?.['roles'] as AppRole[] | undefined) ?? ADMIN_ROLES;

  if (!session.user()) {
    try {
      await session.loadCurrentUser();
    } catch {
      return router.createUrlTree(['/login']);
    }
  }

  return session.hasAnyRole(allowedRoles) ? true : router.createUrlTree(['/']);
};

