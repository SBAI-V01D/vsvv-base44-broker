import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService, Report } from '../services/report.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Berichte</h1>
        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Bericht erstellen</button>
      </div>
      <div class="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Name</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Erstellt am</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Status</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Aktionen</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let r of reports()" class="hover:bg-gray-50">
              <td class="px-6 py-4 font-medium">{{ r.name }}</td>
              <td class="px-6 py-4 text-gray-500">{{ r.generated }}</td>
              <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-xs bg-green-100 text-green-700">{{ r.status }}</span>
              </td>
              <td class="px-6 py-4 flex gap-2">
                <button class="text-gray-600 hover:text-blue-600">Anzeigen</button>
                <button class="text-gray-600 hover:text-blue-600">Download</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ReportsPage implements OnInit {
  private service = inject(ReportService);
  protected reports = signal<Report[]>([]);

  ngOnInit(): void {
    this.service.getAll().subscribe(data => this.reports.set(data));
  }
}
