import { Injectable, inject } from '@angular/core';
import { ApiService, Commission } from '../../../core/services/api.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CommissionService {
  private api = inject(ApiService);

  getAll(): Observable<Commission[]> {
    return this.api.getCommissions();
  }

  getByPeriod(month?: string): Observable<Commission[]> {
    return this.api.getCommissions();
  }

  getTotalByMonth(): Observable<Record<string, number>> {
    return this.api.getCommissions();
  }
}