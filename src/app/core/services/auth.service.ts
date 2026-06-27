import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';
import { UserRole } from './roles';

/**
 * AuthService
 *
 * Main authentication service.  Bridges the low-level `AuthStateService`
 * (which uses signals & observables) to a simpler imperative API that
 * guards and components depend on.
 *
 * Roles (7): superadmin, admin, manager, underwriter, broker, support, analytics
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private authState = inject(AuthStateService);
  private router = inject(Router);

  private user = signal<import('./auth-state.service').AuthUser | null>(null);

  constructor() {
    // Attempt to read user from sessionStorage as fallback
    const stored = sessionStorage.getItem('user');
    if (stored) {
      try {
        this.user.set(JSON.parse(stored));
      } catch {
        void 0;
      }
    }

    // Sync with AuthStateService signal when available
    if (this.authState.user() !== null) {
      this.user.set(this.authState.user());
    }
  }

  get user(): import('./auth-state.service').AuthUser | null {
    return this.user();
  }

  get user$() {
    return this.user.asReadonly();
  }

  /** Whether the user has a valid session token. */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated() || !!sessionStorage.getItem('token');
  }

  /** Retrieve the authenticated user's roles array. */
  getUserRoles(): UserRole[] {
    const u = this.user();
    if (u && Array.isArray(u.roles)) return u.roles;
    return this.authState.getUserRoles() ?? [];
  }

  /** Login: store token + user in session and update signals. */
  login(email: string, password: string) {
    // Delegate to AuthStateService for the actual HTTP call
    this.authState.login(email, password).subscribe({
      next: (user) => {
        this.user.set(user);
        sessionStorage.setItem('token', 'true');
        sessionStorage.setItem('user', JSON.stringify(user));
      },
      error: () => {
        // Login failed – keep existing state
      },
    });
  }

  /** Logout: clear in-memory state + sessionStorage and redirect. */
  logout(): void {
    this.authState.logout();
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.user.set(null);
    this.router.navigate(['/login']);
  }
}
