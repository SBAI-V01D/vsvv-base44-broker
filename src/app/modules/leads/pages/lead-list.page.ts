import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Lead } from '../../../core/services/api.service';

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Leads</h1>
          <p class="text-sm text-gray-500 mt-1">Vertriebs-Leads &&#8203; Pipeline</p>
        </div>
        <button class="btn btn-primary text-sm">+ Lead anlegen</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">New</p>
          <p class="text-2xl font-bold text-blue-600">{{ count('new') }}</p>
        </div>
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">Contacted</p>
          <p class="text-2xl font-bold text-yellow-600">{{ count('contacted') }}</p>
        </div>
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">Qualified</p>
          <p class="text-2xl font-bold text-orange-600">{{ count('qualified') }}</p>
        </div>
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">Converted</p>
          <p class="text-2xl font-bold text-green-600">{{ count('converted') }}</p>
        </div>
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">Lost</p>
          <p class="text-2xl font-bold text-red-600">{{ count('lost') }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl border overflow-hidden">
        <div class="p-4 border-b">
          <input type="text" placeholder="Leads suchen..." class="w-full md:w-80 px-3 py-2 border rounded-lg text-sm"/>
        </div>
        <div class="divide-y">
          <div *ngFor="let lead of leads()" class="p-4 hover:bg-gray-50 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-sm">
                {{ lead.name?.charAt(0) || '?' }}
              </div>
              <div>
                <p class="font-medium">{{ lead.name || 'Unbekannt' }}</p>
                <p class="text-sm text-gray-500">{{ lead.email ?? '' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-500">{{ lead.source ?? '—' }}</span>
              <span [class]="'status-' + statusClass(lead.status)">{{ lead.status }}</span>
              <button class="btn btn-outline text-xs">Konvertieren</button>
            </div>
          </div>
          <div *ngIf="leads().length === 0" class="p-8 text-center text-gray-500">
            Keine Leads gefunden
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-new { @apply bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs; }
    .status-contacted { @apply bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs; }
    .status-qualified { @apply bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs; }
    .status-converted { @apply bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs; }
    .status-lost { @apply bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs; }
  `]
})
export class LeadListPage implements OnInit {
  leads = signal<Lead[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getLeads().subscribe({
      next: (res: any) => this.leads.set(res || [])
    });
  }

  count(status: string): number {
    return this.leads().filter(l => l.status === status).length;
  }

  statusClass(status?: string): string {
    return status || 'new';
  }
}