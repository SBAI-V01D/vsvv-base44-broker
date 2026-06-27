import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CommissionService, Commission } from '../services/commission.service';

@Component({
  selector: 'app-commissions-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Provisionen</h1>
          <p class="text-sm text-gray-500 mt-1">Provisionsubersichten und -zahlungen</p>
        </div>
        <button class="btn btn-primary text-sm">Provision berechnen</button>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="text-sm text-gray-500">Gesamtprovision</div>
          <div class="text-2xl font-bold mt-1 text-green-600">125,340 CHF</div>
        </div>
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="text-sm text-gray-500">Offen</div>
          <div class="text-2xl font-bold mt-1 text-yellow-600">12,800 CHF</div>
        </div>
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="text-sm text-gray-500">Zugegangen</div>
          <div class="text-2xl font-bold mt-1">10</div>
        </div>
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="text-sm text-gray-500">Zahlungspflichtig</div>
          <div class="text-2xl font-bold mt-1 text-red-600">5</div>
        </div>
      </div>

      <!-- Commission List -->
      <div class="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Interessent</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Richtlinie</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Hera</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Status</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Aktionen</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let commission of commissions()" class="hover:bg-gray-50">
              <td class="px-6 py-4 font-medium">{{ commission.clientId }}</td>
              <td class="px-6 py-4">{{ commission.policy }}</td>
              <td class="px-6 py-4 font-mono">{{ commission.amount }} CHF</td>
              <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs" [class]="'bg-' + statusColor(commission.status) + '-100 text-' + statusColor(commission.status) + '-700'">{{ commission.status }}</span></td>
              <td class="px-6 py-4"><a [routerLink]="['/app/commissions/', commission.id]" class="text-blue-600 hover:underline">Details</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class CommissionsDashboardPage implements OnInit {
  private commissionService = inject(CommissionService);
  protected commissions = signal<Commission[]>([]);

  ngOnInit(): void {
    this.commissionService.getAll().subscribe({ next: (data) => this.commissions.set(data) });
  }

  protected statusColor(status: string): string {
    switch (status) {
      case 'confirmed': return 'green';
      case 'pending': return 'yellow';
      case 'payment': return 'blue';
      case 'calculation': return 'gray';
      default: return 'gray';
    }
  }
}
