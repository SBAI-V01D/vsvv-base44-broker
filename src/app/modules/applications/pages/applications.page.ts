import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApplicationService, Application } from '../services/application.service';

@Component({
  selector: 'app-applications-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Anträge</h1>
          <p class="text-sm text-gray-500 mt-1">Verwalten Sie einreichungen und Antragsstatus</p>
        </div>
        <button class="btn btn-primary text-sm">Neuer Antrage</button>
      </div>

      <!-- Pipeline View -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div *ngFor="let stage of stages" class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-sm">{{ stage.label }}</h3>
            <span class="px-2 py-1 rounded bg-gray-100 text-xs">{{ stage.count }}</span>
          </div>
          <div class="space-y-2">
            <div *ngFor="let app of getApplicationsForStage(stage.label)" class="bg-white rounded-lg p-3 border shadow-sm hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-sm">{{ app.customerName }}</span>
                <span class="text-xs text-gray-400">{{ app.date }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">{{ app.product }}</span>
                <button [routerLink]="['/app/applications/', app.id]" class="text-blue-600 text-xs hover:underline">Details</button>
              </div>
              <div class="mt-3 flex gap-2">
                <button class="text-xs px-2 py-1 rounded bg-green-100 text-green-700 flex-1 text-center">Genehmigen</button>
                <button class="text-xs px-2 py-1 rounded bg-red-100 text-red-700 flex-1 text-center">Abweisen</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ApplicationsDashboardPage implements OnInit {
  private applicationService = inject(ApplicationService);
  protected applications = signal<Application[]>([]);

  protected stages = [
    { label: 'In Einreichung', count: 5 },
    { label: 'Prüfung', count: 3 },
    { label: 'Genehmigung', count: 8 },
    { label: 'Abgeschlossen', count: 12 },
  ];

  protected ngOnInit(): void {
    this.applicationService.getAll().subscribe({ next: (data) => this.applications.set(data) });
  }

  protected getApplicationsForStage(stage: string): Application[] {
    return this.applications().filter(app => this.mapToStage(app.status) === stage);
  }

  protected mapToStage(status: string): string {
    switch (status) {
      case 'submitted': return 'In Einreichung';
      case 'review': return 'Prüfung';
      case 'approved': return 'Genehmigung';
      case 'completed': return 'Abgeschlossen';
      default: return 'In Einreichung';
    }
  }
}
