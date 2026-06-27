import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LeadService, Lead } from '../services/lead.service';

@Component({
  selector: 'app-leads-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Leads</h1>
          <p class="text-sm text-gray-500 mt-1">Verwalten Sie Ihre Leads und das Vertriebspipeline</p>
        </div>
        <button class="btn btn-primary text-sm">Neuer Lead</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="text-sm text-gray-500">Alle Leads</div>
          <div class="text-2xl font-bold mt-1">{{ leads().length }}</div>
        </div>
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="text-sm text-gray-500">Konversionsrate</div>
          <div class="text-2xl font-bold mt-1 text-green-600">32%</div>
        </div>
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="text-sm text-gray-500">Warenwert</div>
          <div class="text-2xl font-bold mt-1">CHF {{ totalValue() }}</div>
        </div>
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="text-sm text-gray-500">Neue diese Woche</div>
          <div class="text-2xl font-bold mt-1 text-blue-600">3</div>
        </div>
      </div>

      <div class="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Name</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Kontakt</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Quelle</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Pipeline</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Wert</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Aktionen</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let lead of leads()" class="hover:bg-gray-50">
              <td class="px-6 py-4 font-medium">{{ lead.name }}</td>
              <td class="px-6 py-4">
                <div class="text-xs">{{ lead.email }}</div>
                <div class="text-xs text-gray-500">{{ lead.phone }}</div>
              </td>
              <td class="px-6 py-4 text-gray-500">{{ lead.source }}</td>
              <td class="px-6 py-4">
                <span [class]="'px-2 py-1 rounded text-xs ' + stageClass(lead.status)">{{ stageLabel(lead.status) }}</span>
                <div class="mt-1">
                  <div class="w-full h-2 bg-gray-200 rounded">
                    <div [style.width.%]="(lead.value / 100)" class="h-full bg-green-500 rounded"></div>
                  </div>
                  <div class="text-[10px] text-gray-400 text-right">{{ lead.conversionProbability }}%</div>
                </div>
              </td>
              <td class="px-6 py-4">CHF {{ lead.value.toLocaleString() }}</td>
              <td class="px-6 py-4 flex gap-2">
                <button class="text-blue-600 hover:text-blue-800 p-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12v9m0-9l3-3m-3 3l-3-3m12 9v-3m0 3l3-3m-3 3l3-3"></path></svg></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class LeadsDashboardPage implements OnInit {
  private leadService = inject(LeadService);
  protected leads = signal<Lead[]>([]);

  protected totalValue(): string {
    return this.leads().reduce((sum, l) => sum + l.value, 0).toLocaleString();
  }

  ngOnInit(): void {
    this.leadService.getAll().subscribe({ next: (data) => this.leads.set(data) });
  }

  protected stageClass(s: string): string {
    if (s === 'new') return 'bg-gray-100 text-gray-700';
    if (s === 'contacted') return 'bg-yellow-100 text-yellow-700';
    if (s === 'qualified') return 'bg-blue-100 text-blue-700';
    if (s === 'proposal') return 'bg-purple-100 text-purple-700';
    if (s === 'won') return 'bg-green-100 text-green-700';
    return 'bg-red-100 text-red-700';
  }

  protected stageLabel(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
