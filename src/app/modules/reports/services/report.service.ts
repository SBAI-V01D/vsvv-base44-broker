import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Report { id: string; name: string; generated: string; status: string; };

@Injectable({ providedIn: 'root' })
export class ReportService {
  private reports: Report[] = [
    { id: 'r1', name: 'Q1 2024 Bericht', generated: '2024-01-31', status: 'completed' },
    { id: 'r2', name: 'Q2 2024 Bericht', generated: '2024-04-15', status: 'pending' },
  ];

  getAll(): Observable<Report[]> {
    return new Observable(o => { o.next(this.reports); o.complete(); });
  }
}
