import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomerService, Customer } from '../services/customer.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Kunden</h1>
        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Neuer Kunde</button>
      </div>
      <div class="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Name</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Unternehmen</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Ort</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Richtlinien</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Status</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Aktionen</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let c of customers()" class="hover:bg-gray-50">
              <td class="px-6 py-4">{{ c.firstName }} {{ c.lastName }}</td>
              <td class="px-6 py-4 text-gray-500">{{ c.companyName || '-' }}</td>
              <td class="px-6 py-4 text-gray-500">{{ c.city }}</td>
              <td class="px-6 py-4">{{ c.activePolicies }}</td>
              <td class="px-6 py-4">
                <span [class]="'px-2 py-1 rounded text-xs ' + (c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')">{{ c.status }}</span>
              </td>
              <td class="px-6 py-4 flex gap-2">
                <button class="text-gray-600 hover:text-blue-600">Bearbeiten</button>
                <button class="text-gray-600 hover:text-blue-600">Details</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class CustomersPage implements OnInit {
  private service = inject(CustomerService);
  protected customers = signal<Customer[]>([]);

  ngOnInit(): void {
    this.service.getAll().subscribe(data => this.customers.set(data));
  }
}
