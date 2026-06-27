import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Document } from '../../../core/services/api.service';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Dokumente</h1>
        <button class="btn btn-primary text-sm" (click)="triggerUpload()">Dokument hochladen</button>
        <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)" multiple />
      </div>
      <div class="bg-white rounded-xl border overflow-hidden">
        <div class="divide-y">
          <div *ngFor="let d of documents()" class="p-4 hover:bg-gray-50 flex items-center justify-between">
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
        </div>
      </div>
    </div>
  `
})
export class DocumentListPage implements OnInit {
  documents = signal<Document[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getDocuments().subscribe({
      next: (res: any) => this.documents.set(res || [])
    });
  }

  triggerUpload(): void {
    document.getElementById('file-input')?.click();
  }

  onFileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      // upload logic (requires customer context)
      console.log('Files selected:', files);
    }
  }
}