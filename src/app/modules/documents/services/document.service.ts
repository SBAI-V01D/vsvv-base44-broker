import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  owner: string;
  category: string;
  uploadedDate: string;
  version: number;
  size: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private api = inject(ApiService);

  getAll(): Observable<DocumentItem[]> {
    return this.api.getDocuments().pipe(
      map((docs: any[]) => docs.map(d => ({
        id: d.id,
        name: d.name || d.filename,
        type: d.mime_type?.split('/')[1] || 'pdf',
        owner: d.uploaded_by || 'Admin',
        category: d.category || d.doc_type || 'Allgemein',
        uploadedDate: d.created_date || d.uploaded_at || new Date().toISOString().split('T')[0],
        version: 1,
        size: d.file_size ? `${(d.file_size / 1024 / 1024).toFixed(1)} MB` : '—',
      })))
    );
  }

  upload(name: string, _category: string, file?: File): Observable<DocumentItem> {
    if (file) {
      return new Observable(o => {
        this.api.uploadDocument('', file).subscribe({
          next: (res: any) => {
            const doc: DocumentItem = {
              id: res.id || res.documentId || String(Date.now()),
              name: res.name || name,
              type: res.mime_type?.split('/')[1] || 'pdf',
              owner: 'Admin',
              category: _category,
              uploadedDate: new Date().toISOString().split('T')[0],
              version: 1,
              size: res.file_size ? `${(res.file_size / 1024 / 1024).toFixed(1)} MB` : '—',
            };
            o.next(doc);
            o.complete();
          },
          error: (err) => o.error(err),
        });
      });
    }
    return this.getAll().pipe(map(list => list[0]));
  }

  delete(id: string): Observable<void> {
    return new Observable(o => { o.next(); o.complete(); });
  }
}
