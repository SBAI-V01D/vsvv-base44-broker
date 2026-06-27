import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ReportDataItem {
  label: string;
  value: number;
  date: string;
  category: string;
}

export interface ReportConfig {
  id: string;
  name: string;
  type: 'revenue' | 'commission' | 'conversion' | 'custom';
  filters: string[];
  lastRun?: string;
  status: 'active' | 'draft' | 'archived';
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private reports: ReportConfig[] = [
    { id: 'r1', name: 'Monatlicher Umsatz', type: 'revenue', filters: ['monatlich'], status: 'active' },
    { id: 'r2', name: 'Commission nach Quartal', type: 'commission', filters: ['quartal'], status: 'active' },
    { id: 'r3', name: 'Conversion Rate', type: 'conversion', filters: ['monatlich'], status: 'draft' },
  ];

  getAll(): Observable<ReportConfig[]> {
    return new Observable(obs => { obs.next(this.reports); obs.complete(); });
  }

  getById(id: string): Observable<ReportConfig | undefined> {
    return new Observable(obs => {
      obs.next(this.reports.find(r => r.id === id));
      obs.complete();
    });
  }

  generate(reportId: string, filters: Record<string, any>): Observable<any> {
    const data = [...Array(30)].map((_, i) => ({
      label: `Monat ${i + 1}`, value: Math.floor(Math.random() * 10000), date: `2024-01-${String(i + 1).padStart(2, '0')}`, category: filters.category
    }));
    return new Observable(obs => { obs.next(data); obs.complete(); });
  }

  save(rpt: Omit<ReportConfig, 'id'>): Observable<ReportConfig> {
    const newRpt: ReportConfig = { ...rpt, id: String(Date.now()) };
    this.reports.push(newRpt);
    return new Observable(obs => { obs.next(newRpt); obs.complete(); });
  }

  delete(id: string): Observable<void> {
    this.reports = this.reports.filter(r => r.id !== id);
    return new Observable(obs => { obs.next(); obs.complete(); });
  }
}
