import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService, Contract } from '../../../core/services/api.service';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Verträge</h1>
          <p class="text-sm text-gray-500 mt-1">Alle Versicherungs&amp;#220; Verträge</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-outline text-sm">Exportieren</button>
          <button class="btn btn-primary text-sm">Neuer Vertrag</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">Aktiv</p>
          <p class="text-2xl font-bold">{{ activeCount() }}</p>
        </div>
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">Läuft ab (30 Tage)</p>
          <p class="text-2xl font-bold text-orange-600">{{ upcomingCount() }}</p>
        </div>
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">Gesamtprämie</p>
          <p class="text-2xl font-bold">{{ totalPremium() | number:'1.0-0' }} €</p>
        </div>
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">Durchschnittsprämie</p>
          <p class="text-2xl font-bold">{{ avgPremium() | number:'1.0-0' }} €</p>
        </div>
      </div>

      <div class="bg-white rounded-xl border overflow-hidden">
        <div class="p-4 border-b">
          <input type="text" placeholder="Verträge suchen..." class="w-full md:w-80 px-3 py-2 border rounded-lg text-sm"/>
        </div>
        <div class="divide-y">
          <div *ngFor="let c of contracts()" class="p-4 hover:bg-gray-50 flex items-center justify-between">
            <div>
              <p class="font-medium">{{ c.customerName || 'Unbekannt' }}</p>
              <p class="text-sm text-gray-500">{{ c.versicherung }} • {{ c.sparte }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold">{{ c.premium | number:'1.0-0' }} €/Jahr</p>
              <span [class]="statusClass(c.status)">{{ c.status }}</span>
            </div>
          </div>
          <div *ngIf="contracts().length === 0" class="p-8 text-center text-gray-500">
            Keine Verträge gefunden
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-newbusiness { @apply bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs; }
    .status-renewal { @apply bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs; }
    .status-cancelled { @apply bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs; }
  `]
})
export class ContractListPage implements OnInit {
  contracts = signal<Contract[]>([]);
  loading = signal(false);

  activeCount = computed(() => this.contracts().filter(c => c.status === 'active').length);
  upcomingCount = computed(() => this.contracts().filter(c => c.status === 'expiring').length);
  totalPremium = computed(() => this.contracts().reduce((sum, c) => sum + (c.premium || 0), 0));
  avgPremium = computed(() => {
    const total = this.totalPremium();
    const count = this.contracts().length || 1;
    return total / count;
  });

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getContracts().subscribe({
      next: (res: any) => this.contracts.set(res || []),
      error: () => this.contracts.set([])
    });
  }

  statusClass(status?: string): string {
    return 'status-' + (status || 'newbusiness');
  }
}