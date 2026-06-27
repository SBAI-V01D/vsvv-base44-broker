import { Injectable, inject } from '@angular/core';
import {
  CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot,
  Router, UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ROLE_PERMISSIONS, UserRole } from '../services/roles';
import { PermissionsGuardService } from '../services/permissions-guard.service';

/**
 * PermissionGuard
 *
 * Authorises a route only when the current user's roles collectively own every
 * permission listed in `requiredPermissions`.
 *
 * Define protected routes like:
 *
 *   {
 *     path: 'admin/users',
 *     canActivate: [PermissionGuard],
 *     data: {
 *       requiredPermissions: ['users.create', 'users.delete'],
 *     },
 *     component: UserAdminPage,
 *   },
 *
 * For module-level routes that mix read + write permissions, include all of
 * them in `requiredPermissions`.  The guard will deny access if the user
 * lacks **any** single permission.
 *
 * Seven roles exist: superadmin > admin > manager > underwriter > broker > support > analytics
 */
@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);
  private permissionsService = inject(PermissionsGuardService);

  canActivate(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): boolean | UrlTree {
    const requiredPermissions =
      route.data['requiredPermissions'] as string[] | undefined;

    // No permission filter → allow
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const userRoles = this.auth.user()?.roles ?? [];

    // If there are roles we can check them directly, otherwise delegate to
    // PermissionsGuardService which aggregates permissions from data + roles
    // This also covers the case of roles being stored as part of the user object.
    if (userRoles.length > 0) {
      const allPermissions = new Set<string>();
      for (const role of userRoles) {
        const rolePermissions = ROLE_PERMISSIONS[role as UserRole];
        if (rolePermissions) {
          rolePermissions.forEach((p) => allPermissions.add(p));
        }
      }

      const missing = requiredPermissions.filter(
        (p) => !allPermissions.has(p),
      );

      if (missing.length === 0) {
        return true;
      }

      return this.router.parseUrl('/dashboard/unauthorised', {
        queryParams: {
          reason: `Missing permissions: ${missing.join(', ')}`,
        },
      });
    }

    // Delegate to service for the data permissions case
    const hasPermissions = this.permissionsService.hasPermissions(
      requiredPermissions,
    );

    if (!hasPermissions) {
      return this.router.parseUrl('/dashboard/unauthorised', {
        queryParams: {
          reason: `Missing permissions: ${requiredPermissions.join(', ')}`,
        },
      });
    }

    return true;
  }
}

/**
 * Permission Guard (canActivateFn)
 *
 * A functional guard version of `PermissionGuard` for route-level inline usage.
 * Use it in `canActivate` arrays exactly like any other `CanActivateFn`:
 *
 *   {
 *     path: 'claims',
 *     canActivate: [permissionGuard(['claims.create', 'claims.approve'])],
 *     component: ClaimsPage,
 *   }
 */
export function permissionGuard(permittedPermissions: string[]): CanActivateFn {
  return (_, __) => {
    const guard = inject(PermissionGuard);
    return guard.canActivate(
      { data: { requiredPermissions: permittedPermissions } } as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
    );
  };
}