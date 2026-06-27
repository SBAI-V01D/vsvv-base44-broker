import { Injectable, inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

/**
 * `hasRoleGuard`
 *
 * Role-based access control guard.
 *
 * Usage in routes:
 *   {
 *     path: 'admin',
 *     canActivate: [hasRoleGuard],
 *     data: { roles: ['admin', 'manager'] },
 *     children: [...]
 *   }
 */
@Injectable({ providedIn: 'root' })
export class HasRoleGuard {
  private auth = inject(AuthStateService);

  canActivate(
    permittedRoles: string | string[]
  ): boolean {
    const allowed = Array.isArray(permittedRoles)
      ? permittedRoles
      : [permittedRoles];

    const userRoles = this.auth.getUserRoles() ?? [];
    return allowed.some(role => userRoles.includes(role));
  }
}

// Also export as a function for route config inline usage
export function hasRoleGuard(permittedRoles: string | string[]): CanActivateFn {
  const guard = new HasRoleGuard();
  return () => guard.canActivate(permittedRoles);
}
