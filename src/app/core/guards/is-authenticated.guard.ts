import { Injectable, inject } from '@angular/core';
import { AuthStateService } from '../services/auth-state.service';
import { Router, type RouterStateSnapshot, type UrlTree } from '@angular/router';

/**
 * `isAuthenticatedGuard`
 *
 * Allows navigation if the user has an active session (token present + validated).
 * Redirects to `/login` otherwise.
 */
@Injectable({ providedIn: 'root' })
export class IsAuthenticatedGuard {
  private auth = inject(AuthStateService);
  private router = inject(Router);

  canActivate(): boolean | UrlTree {
    if (this.auth.isAuthenticated()) {
      return true;
    }

    // Preserve the requested URL so we can redirect back after login
    const returnUrl = this.router.url;
    return this.router.parseUrl('/login', { queryParams: { returnUrl } });
  }
}
