import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DocumentService, DocumentItem } from '../services/document.service';

@Component({
  selector: 'app-documents-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Dokumente</h1>
          <p class="text-sm text-gray-500 mt-1">Alle Dokumente und deren Versionen</p>
        </div>
        <button class="btn btn-primary text-sm">Dokument hochladen</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="text-sm text-gray-500">Dokumente insgesamt</div>
          <div class="text-2xl font-bold mt-1">126</div>
        </div>
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="text-sm text-gray-500">Kategorien</div>
          <div class="text-2xl font-bold mt-1">8</div>
        </div>
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="text-sm text-gray-500">Neu (heute)</div>
          <div class="text-2xl font-bold mt-1 text-green-600">3</div>
        </div>
      </div>

      <div class="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Name</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Typ</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Kategorie</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Version</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Hochgeladen</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Aktionen</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let doc of documents()" class="hover:bg-gray-50">
              <td class="px-6 py-4 font-medium">{{ doc.name }}</td>
              <td class="px-6 py-4"><span class="px-2 py-1 rounded bg-gray-100 text-xs uppercase">{{ doc.type }}</span></td>
              <td class="px-6 py-4">{{ doc.category }}</td>
              <td class="px-6 py-4">v{{ doc.version }}</td>
              <td class="px-6 py-4 text-gray-500">{{ doc.uploadedDate }}</td>
              <td class="px-6 py-4 flex gap-2">
                <button class="text-blue-600 hover:text-blue-800 p-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg></button>
                <button class="text-red-600 hover:text-red-800 p-1"><svg class="w-4 h-4" fill="none" stroke=""currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class DocumentsDashboardPage implements OnInit {
  private documentService = inject(DocumentService);
  protected documents = signal<DocumentItem[]>([]);

  ngOnInit(): void {
    this.documentService.getAll().subscribe({ next: (data) => this.documents.set(data) });
  }
}
