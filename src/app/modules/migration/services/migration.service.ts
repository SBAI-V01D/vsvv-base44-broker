import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface MigrationFile { id: string; filename: string; status: string; created: string; }

@Injectable({ providedIn: 'root' })
export class MigrationService {
  private files: MigrationFile[] = [
    { id: 'm1', filename: 'customer_export.csv', status: 'processed', created: '2024-01-10' },
  ];

  upload(file: Omit<MigrationFile, 'id' | 'status' | 'created'>): Observable<MigrationFile> {
    const f = { ...file, id: String(Date.now()), status: 'new', created: new Date().toISOString().split('T')[0] };
    this.files.push(f);
    return new Observable(o => { o.next(f); o.complete(); });
  }
}
