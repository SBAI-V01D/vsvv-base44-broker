import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Document } from '../../../core/services/api.service';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Dokumente</h1>
        <button class="btn btn-primary text-sm" (click)="fileInput.click()">Dokument hochladen</button>
        <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)" multiple accept=".pdf,.jpg,.jpeg,.png" />
      </div>

      @if (uploading()) {
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 flex items-center gap-2">
          <span class="animate-spin">&#9696;</span> Dokument wird hochgeladen...
        </div>
      }
      @if (errorMsg()) {
        <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{{ errorMsg() }}</div>
      }

      <div class="bg-white rounded-xl border overflow-hidden">
        <div class="divide-y">
          @for (d of documents(); track d.id) {
            <div class="p-4 hover:bg-gray-50 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <div>
                  <p class="font-medium">{{ d.filename }}</p>
                  <p class="text-sm text-gray-500">{{ d.customer_name || 'Nur' }} • {{ d.created_date | date:'dd.MM.yy  yyyy' }}</p>
                </div>
              </div>
              <div class="flex gap-2">
                <button class="btn btn-outline text-xs">Anzeigen</button>
                <button class="btn btn-outline text-xs">Download</button>
              </div>
            </div>
          } @empty {
            <div class="p-8 text-center text-gray-400 text-sm">Keine Dokumente vorhanden</div>
          }
        </div>
      </div>
    </div>
  `
})
export class DocumentListPage implements OnInit {
  documents = signal<Document[]>([]);
  uploading = signal(false);
  errorMsg = signal<string | null>(null);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getDocuments().subscribe({
      next: (res: any) => this.documents.set(res || [])
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    this.uploading.set(true);
    this.errorMsg.set(null);

    this.api.uploadDocuments(Array.from(files)).subscribe({
      next: () => {
        this.uploading.set(false);
        input.value = '';
        // Refresh document list
        this.api.getDocuments().subscribe({
          next: (res: any) => this.documents.set(res || [])
        });
      },
      error: (err) => {
        this.uploading.set(false);
        this.errorMsg.set(err?.message || 'Upload fehlgeschlagen');
        input.value = '';
      }
    });
  }
}