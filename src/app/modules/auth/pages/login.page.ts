import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthStateService } from '../../../core/services/auth-state.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Premium Broker</h1>
          <p class="text-gray-500 mt-2">Melden Sie sich an</p>
        </div>
        <form (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              [(ngModel)]="credentials.email"
              name="email"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin@premium.at"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Passwort</label>
            <input
              type="password"
              [(ngModel)]="credentials.password"
              name="password"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            [disabled]="loading()"
          >
            {{ loading() ? 'Anmelden...' : 'Anmelden' }}
          </button>
          <p class="text-center text-sm text-gray-500 mt-4">
            Demo: admin@premium.at / admin123
          </p>
        </form>
      </div>
    </div>
  `
})
export class LoginPage {
  private auth = inject(AuthStateService);
  private router = inject(Router);

  credentials = { email: '', password: '' };
  loading = signal(false);

  onSubmit(): void {
    if (!this.credentials.email || !this.credentials.password) return;
    this.loading.set(true);
    
    // Mock authentication
    setTimeout(() => {
      this.authService.login({
        email: this.credentials.email,
        name: 'Premium User',
        role: 'broker',
        token: 'mock-jwt-token'
      });
      this.loading.set(false);
      this.router.navigate(['/app/dashboard']);
    }, 500);
  }

  // Using the injected auth instance correctly
  get authService() { return this.auth; }
}