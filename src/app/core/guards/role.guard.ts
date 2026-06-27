import { Injectable, inject } from '@angular/core';
import {
  CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot,
  Router, UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole, ROLE_LABELS } from '../services/roles';

/**
 * RoleGuard
 *
 * Authorises a route only when the current user holds one of the permitted roles.
 *
 * Define protected routes like:
 *
 *   {
 *     path: 'settings',
 *     canActivate: [RoleGuard],
 *     data: { requiredRoles: ['superadmin', 'admin'] as UserRole[] },
 *     component: SettingsPage,
 *   },
 *
 * If the user lacks every role in `requiredRoles` they are redirected to
 * `/dashboard/unauthorised` with a human-readable reason.
 *
 * Seven roles are supported:
 *   superadmin > admin > manager > underwriter > broker > support > analytics
 */
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): boolean | UrlTree {
    const requiredRoles = route.data['requiredRoles'] as UserRole[] | undefined;
    const userRoles = this.auth.user()?.roles ?? [];

    // No role filter → allow
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Check if user has at least one of the required roles
    const userRoleSets = new Set(userRoles);
    const hasRequired = requiredRoles.some((r) => userRoleSets.has(r.toLowerCase()));

    if (hasRequired) {
      return true;
    }

    const roleNames = requiredRoles.map(
      (r) => ROLE_LABELS[r] ?? r
    );
    return this.router.parseUrl('/dashboard/unauthorised', {
      queryParams: {
        reason: 'Erwartet: ' + roleNames.join(' oder '),
        userRoles: userRoles.join(', '),
        required: requiredRoles.join(','),
      },
    });
  }
}
