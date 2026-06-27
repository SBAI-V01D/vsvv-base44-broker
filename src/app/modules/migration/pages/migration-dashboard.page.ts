import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MigrationService, MigrationRecord } from '../services/migration.service';

@Component({
  selector: 'app-migration-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  template: `<div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Migration &amp; Import</h1>
          <p class="text-sm text-gray-500 mt-1">Datenmigrationen verwalten und Überwachen</p>
        </div>
        <button class="btn btn-primary text-sm">Neue Migration</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-5 border">
          <p class="text-sm text-gray-500">In Bearbeitung</p>
          <p class="text-2xl font-bold text-blue-600">{{ processingCount() }}</p>
        </div>
        <div class="bg-white rounded-xl p-5 border">
          <p class="text-sm text-gray-500">Erfolgreich</p>
          <p class="text-2xl font-bold text-green-600">{{ completedCount() }}</p>
        </div>
        <div class="bg-white rounded-xl p-5 border">
          <p class="text-sm text-gray-500">Fehlerhaft</p>
          <p class="text-2xl font-bold text-red-600">{{ failedCount() }}</p>
        </div>
        <div class="bg-white rounded-xl p-5 border">
          <p class="text-sm text-gray-500">Wartend</p>
          <p class="text-2xl font-bold text-yellow-600">{{ pendingCount() }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border overflow-hidden">
        <div class="p-4 border-b">
          <h2 class="font-semibold">Migrationen</h2>
        </div>
        <div class="divide-y">
          <div *ngFor="let m of migrations()" class="p-4 hover:bg-gray-50">
            <div class="flex items-center justify-between mb-2">
              <div>
                <p class="font-semibold text-sm mb-1">{{ m.name }}</p>
                <div class="flex items-center gap-4 text-xs text-gray-500">
                  <span>Typ: {{ m.sourceType }} → {{ m.targetType }}</span>
                </div>
              </div>
              <div class="flex gap-3 items-center">
                <span [class]="statusClass(m.status)">{{ statusLabel(m.status) }}</span>
                <button class="btn btn-outline text-xs" [routerLink]="['/app/migration', m.id]">Details</button>
              </div>
            </div>
            <div class="mt-3">
              <div class="flex justify-between text-xs text-gray-600 mb-1">
                <span>Fortschritt</span><span>{{ progress(m) }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="rounded-full h-2 transition-all duration-500" [style.width.%]="progress(m)" [ngClass]="{'bg-blue-500': m.status==='processing','bg-green-500': m.status==='completed','bg-red-500': m.status==='failed','bg-yellow-400': m.status==='pending'}"></div>
              </div>
              <p class="text-xs text-gray-400 mt-1" *ngIf="m.recordsTotal > 0">{{ m.recordsProcessed }} / {{ m.recordsTotal }} Datensätze</p>
            </div>
          </div>
          <div *ngIf="migrations().length === 0" class="p-8 text-center text-gray-500">Keine Migrationen vorhanden</div>
        </div>
      </div>
      <div class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p class="text-sm text-blue-600">Unterstützte Quellen: CSV, Excel, XML, JSON, API-Endpunkte</p>
      </div>
    </div>`
})
export class MigrationDashboardPage implements OnInit {
  private migrationService = inject(MigrationService);
  migrations = signal<MigrationRecord[]>([]);

  ngOnInit(): void { this.loadMigrations(); }

  loadMigrations(): void {
    this.migrationService.getAll().subscribe({
      next: (data) => this.migrations.set(data),
      error: () => this.migrations.set([])
    });
  }

  progress(m: MigrationRecord): number {
    return m.recordsTotal > 0 ? Math.round((m.recordsProcessed / m.recordsTotal) * 100) : 0;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { pending: 'Wartend', processing: 'In Bearbeitung', completed: 'Erfolgreich' };
    return map[status] || status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700',
      processing: 'px-2 py-1 rounded text-xs bg-blue-100 text-blue-700',
      completed: 'px-2 py-1 rounded text-xs bg-green-100 text-green-700',
      failed: 'px-2 py-1 rounded text-xs bg-red-100 text-red-700',
    };
    return map[status] || 'px-2 py-1 rounded text-xs bg-gray-100';
  }

  get processingCount(): number { return this.migrations().filter(m => m.status === 'processing').length; }
  get completedCount(): number { return this.migrations().filter(m => m.status === 'completed').length; }
  get failedCount(): number { return this.migrations().filter(m => m.status === 'failed').length; }
  get pendingCount(): number { return this.migrations().filter(m => m.status === 'pending').length; }
}