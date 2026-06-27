import { Injectable, inject } from '@angular/core';
import {
  CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot,
  Router, UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

/**
 * AuthGuard
 *
 * Ensures the user is authenticated (has a valid token).
 * Redirects to `/login` with `returnUrl` query param on failure.
 */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private auth = inject(AuthStateService);
  private router = inject(Router);

  canActivate(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): boolean | UrlTree {
    if (this.auth.isAuthenticated()) {
      return true;
    }

    // Preserve the requested URL so we can redirect back after login
    const returnUrl = this.router.url;
    return this.router.parseUrl('/login', {
      queryParams: { returnUrl },
    });
  }
}
