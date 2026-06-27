import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Application } from '../../../core/services/api.service';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Anträge</h1>
          <p class="text-sm text-gray-500 mt-1">Verwaltungsarbeiten & Antragsbearbeitung</p>
        </div>
        <button class="btn btn-primary text-sm">Neuer Antrag</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">In Bearbeitung</p>
          <p class="text-2xl font-bold text-blue-600">{{ processingCount() }}</p>
        </div>
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">Wartend</p>
          <p class="text-2xl font-bold text-yellow-600">{{ pendingCount() }}</p>
        </div>
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">Genehmigt</p>
          <p class="text-2xl font-bold text-green-600">{{ approvedCount() }}</p>
        </div>
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">Abgelehnt</p>
          <p class="text-2xl font-bold text-red-600">{{ declinedCount() }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl border overflow-hidden">
        <div class="divide-y">
          <div *ngFor="let app of applications()" class="p-4 hover:bg-gray-50">
            <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div>
                <p class="font-medium">{{ app.applicant_name || 'Unbekannt' }}</p>
                <p class="text-sm text-gray-500">{{ app.versicherung }} • {{ app.sparte }}</p>
              </div>
              <span [class]="statusClass(app.status)">{{ app.status }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full" [style.width.%]="app.progress || 0"></div>
            </div>
            <p class="text-xs text-gray-500 mt-1">Fortschritt: {{ app.progress || 0 }}%</p>
          </div>
          <div *ngIf="applications().length === 0" class="p-8 text-center text-gray-500">
            Keine Anträge gefunden
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-new { @apply bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs; }
    .status-in_progress { @apply bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs; }
    .status-approved { @apply bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs; }
    .status-declined { @apply bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs; }
  `]
})
export class ApplicationListPage implements OnInit {
  applications = signal<Application[]>([]);

  processingCount = signal(0);
  pendingCount = signal(0);
  approvedCount = signal(0);
  declinedCount = signal(0);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.api.getApplications().subscribe({
      next: (res: any) => {
        this.setApplications(res || []);
      },
      error: () => this.setApplications([])
    });
  }

  setApplications(data: Application[]): void {
    this.applications.set(data);
    const counts = { processing: 0, pending: 0, approved: 0, declined: 0 };
    data.forEach(a => {
      switch (a.status) {
        case 'in_progress': counts.processing++; break;
        case 'pending': counts.pending++; break;
        case 'approved': counts.approved++; break;
        case 'declined': counts.declined++; break;
      }
    });
    this.processingCount.set(counts.processing);
    this.pendingCount.set(counts.pending);
    this.approvedCount.set(counts.approved);
    this.declinedCount.set(counts.declined);
  }

  statusClass(status?: string): string {
    return 'status-' + (status || 'new');
  }
}