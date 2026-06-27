import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
  private documents: DocumentItem[] = [
    { id: 'd1', name: 'Vertrag_Müller_AG.pdf', type: 'pdf', owner: 'Admin', category: 'Verträge', uploadedDate: '2024-01-15', version: 1, size: '2.4 MB' },
    { id: 'd2', name: 'Police_12345.pdf', type: 'pdf', owner: 'Admin', category: 'Police', uploadedDate: '2024-01-20', version: 1, size: '1.8 MB' },
    { id: 'd3', name: 'Kundendaten.xlsx', type: 'xlsx', owner: 'Admin', category: 'Kunden', uploadedDate: '2024-02-01', version: 2, size: '540 KB' },
  ];

  getAll(): Observable<DocumentItem[]> {
    return new Observable(o => { o.next(this.documents); o.complete(); });
  }

  upload(name: string, _category: string): Observable<DocumentItem> {
    const doc = { id: String(Date.now()), name, type: 'pdf', owner: 'Admin', category: _category, uploadedDate: new Date().toISOString().split('T')[0], version: 1, size: '1.2 MB' };
    this.documents.push(doc);
    return new Observable(o => { o.next(doc); o.complete(); });
  }

  delete(id: string): Observable<void> {
    this.documents = this.documents.filter(d => d.id !== id);
    return new Observable(o => { o.next(); o.complete(); });
  }
}
