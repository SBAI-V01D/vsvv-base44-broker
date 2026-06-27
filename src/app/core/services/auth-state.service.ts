import { Injectable, signal, WritableSignal, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * `AuthStateService`
 *
 * Central authentication state management.
 * Reads token from sessionStorage (matching the React flow).
 */
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private router = inject(Router);

  private userSig: WritableSignal<AppUser | null> = signal<AppUser | null>(null);
  private tokenSignal: WritableSignal<string | null> = signal<string | null>(null);

  constructor() {
    this.tokenSignal.set(this.getAccessToken());
  }

  setToken(token: string): void {
    sessionStorage.setItem('token', token);
    this.tokenSignal.set(token);
  }

  clearToken(): void {
    sessionStorage.removeItem('token');
    this.tokenSignal.set(null);
    this.userSig.set(null);
  }

  isAuthenticated(): boolean {
    return !!this.tokenSignal();
  }

  setUser(user: AppUser | null): void {
    this.userSig.set(user);
  }

  getUser(): AppUser | null {
    return this.userSig();
  }

  getUserRoles(): string[] {
    return this.userSig()?.roles ?? [];
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem('token');
  }

  isAdmin(): boolean {
    return this.getUserRoles().includes('admin');
  }

  navigateToLogin(): void {
    this.clearToken();
    this.router.navigate(['/login']);
  }

  // Expose as signals for Angular templates
  isAuthOpen = this.tokenSignal.asReadonly();
  currentUser = this.userSig.asReadonly();
}

// Minimal user interface matching AuthContext
export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  avatar?: string;
  companyId?: string;
}
