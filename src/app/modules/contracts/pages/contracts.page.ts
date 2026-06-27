import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContractService, Contract } from '../services/contract.service';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Verträge</h1>
        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Neuer Vertrag</button>
      </div>
      <div class="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Richtlinie</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Typ</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Kunde</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Prämie (CHF)</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let c of contracts()" class="hover:bg-gray-50">
              <td class="px-6 py-4 font-medium">{{ c.policyNumber }}</td>
              <td class="px-6 py-4 text-gray-500">{{ c.type }}</td>
              <td class="px-6 py-4 text-gray-500">ID: {{ c.clientId }}</td>
              <td class="px-6 py-4">{{ c.premium.toLocaleString() }}</td>
              <td class="px-6 py-4">
                <span [class]="'px-2 py-1 rounded text-xs ' + (c.status === 'active' ? 'bg-green-100 text-green-700' : c.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')">{{ c.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ContractsPage implements OnInit {
  private service = inject(ContractService);
  protected contracts = signal<Contract[]>([]);

  ngOnInit(): void {
    this.service.getAll().subscribe(data => this.contracts.set(data));
  }
}
