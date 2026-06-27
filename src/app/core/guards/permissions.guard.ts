import { Injectable, inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ROLE_PERMISSIONS, UserRole } from '../services/roles';

/**
 * PermissionsGuardService
 *
 * Utility service queried by guards (and optionally by components) to check
 * whether the current user holds **all** permissions in a supplied list.
 *
 * It works purely from the user profile loaded in the `AuthService` (signal),
 * reading the user's roles and mapping each role to its permission set via
 * `ROLE_PERMISSIONS`.  The service itself is also exported as `PermissionsGuard`
 * so the same logic can be applied in a route `canActivate` array:
 *
 *   {
 *     path: 'claims',
 *     canActivate: [PermissionsGuard],
 *     data: { requiredPermissions: ['claims.create', 'claims.delete'] },
 *     component: ClaimsPage,
 *   }
 *
 * Seven roles: superadmin, admin, manager, underwriter, broker, support, analytics.
 * Seven corresponding permission sets exist for every role.
 */
@Injectable({ providedIn: 'root' })
export class PermissionsGuardService {
  private auth = inject(AuthService);

  /** Check whether the user has all `permissions`. */
  hasPermissions(permissions: string[]): boolean {
    const userRoles = this.auth.user()?.roles ?? [];
    const knownPermissions = new Set<string>();

    for (const role of userRoles) {
      const roleKey = role.toLowerCase() as UserRole;
      const roleSet = ROLE_PERMISSIONS[roleKey];
      if (roleSet) {
        for (const p of roleSet) {
          knownPermissions.add(p);
        }
      }
    }

    return permissions.every((p) => knownPermissions.has(p));
  }

  /** Check *any* of the permissions (OR logic). */
  hasAnyPermission(permissions: string[]): boolean {
    const userRoles = this.auth.user()?.roles ?? [];
    const knownPermissions = new Set<string>();

    for (const role of userRoles) {
      const roleKey = role.toLowerCase() as UserRole;
      const roleSet = ROLE_PERMISSIONS[roleKey];
      if (roleSet) {
        for (const p of roleSet) {
          knownPermissions.add(p);
        }
      }
    }

    return permissions.some((p) => knownPermissions.has(p));
  }
}

/**
 * PermissionsGuard
 *
 * Class-based guard (implements CanActivate) that delegates to
 * `PermissionsGuardService`.  Useful when you need inject() inside the
 * canActivate method or want a named guard class.
 */
@Injectable({ providedIn: 'root' })
export class PermissionsGuard {
  private permissionsService = inject(PermissionsGuardService);

  canActivate(route: import('@angular/router').ActivatedRouteSnapshot): boolean {
    const permissions = route.data['requiredPermissions'] as string[] | undefined;
    if (!permissions || permissions.length === 0) {
      return true;
    }
    return this.permissionsService.hasPermissions(permissions);
  }
}

/**
 * permissionsGuard – functional canActivateFn
 *
 * A functional guard version of `PermissionsGuard` for inline route use:
 *
 *   {
 *     path: 'users',
 *     canActivate: [permissionsGuard(['users.view'])],
 *     component: UsersPage,
 *   }
 */
export function permissionsGuard(
  permissions: string[],
): CanActivateFn {
  const guard = inject(PermissionsGuardService);
  return () => guard.hasPermissions(permissions);
}
