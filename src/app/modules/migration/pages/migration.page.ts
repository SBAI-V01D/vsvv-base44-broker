import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MigrationService, MigrationFile } from '../services/migration.service';

@Component({
  selector: 'app-migration',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">Datenmigration</h1>
      <div class="bg-white rounded-xl border shadow-sm p-6">
        <div class="flex flex-col md:flex-row gap-4 items-center">
          <label class="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Datei auswählen
            <input type="file" class="hidden" (change)="onFileSelected($event)" /u003e
          </label>
          <span class="text-sm text-gray-500">Dateien: {{ selectedFile() || 'Keine ausgewählt' }}</span>
          <button *ngIf="selectedFile()" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Start Migration
          </button>
        </div>
      </div>
      <div class="bg-white rounded-xl border shadow-sm p-6">
        <h3 class="text-lg font-semibold mb-4">Erfolgreiche Migrationen</h3>
        <ul class="space-y-2">
          <li *ngFor="let f of files()" class="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <span class="text-sm">{{ f.filename }}</span>
            <span class="text-xs px-2 py-1 rounded bg-green-100 text-green-700">{{ f.status }}</span>
          </li>
        </ul>
      </div>
    </div>
  `,
})
export class MigrationPage implements OnInit {
  protected selectedFile = signal<string>('');
  protected files = signal<MigrationFile[]>([]);

  ngOnInit(): void {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0]?.name || '');
  }
}
