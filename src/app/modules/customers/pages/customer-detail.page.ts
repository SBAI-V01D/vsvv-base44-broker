import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../services/customer.service';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 *ngIf="customer()" class="text-2xl font-bold">{{ customer()!.firstName }} {{ customer()!.lastName }}</h1>
          <div *ngIf="loading()" class="text-gray-500">Laden...</div>
        </div>
        <button class="btn btn-primary text-sm">Bearbeiten</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2 space-y-4">
          <div class="bg-white rounded-xl border p-6">
            <h2 class="text-lg font-semibold mb-4">Kontaktinformationen</h2>
            <div class="space-y-2 text-sm text-gray-600">
              <p>Email: {{ customer()?.email ?? '--' }}</p>
              <p>Telefon: {{ customer()?.phone ?? '--' }}</p>
              <p>Anschrift: {{ customer()?.address ?? '--' }}</p>
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div class="bg-white rounded-xl border p-6">
            <h2 class="text-lg font-semibold mb-4">Kennzahlen</h2>
            <div class="space-y-2">
              <p class="text-sm text-gray-600">Score: <strong>{{ customer()?.score ?? '--' }}</strong></p>
              <p class="text-sm text-gray-600">Verträge: <strong>{{ customer()?.contractCount ?? 0 }}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomerDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(CustomerService);
  private router = inject(Router);

  loading = signal(true);
  customer = signal<any>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/app/customers']);
      return;
    }
    this.service.getById(id).subscribe({
      next: (data) => {
        this.customer.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}