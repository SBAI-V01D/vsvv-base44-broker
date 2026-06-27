import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Contract {
  id: string;
  policyNumber: string;
  clientId: string;
  type: 'Versicherung' | 'Bank' | 'Anlage';
  startDate: string;
  endDate: string;
  premium: number;
  currency: string;
  status: 'active' | 'pending' | 'cancelled' | 'expired';
  broker: string;
  commission: number;
}

@Injectable({ providedIn: 'root' })
export class ContractService {
  private contracts: Contract[] = [
    { id: 'v1', policyNumber: 'POL-001', clientId: 'c1', type: 'Versicherung', startDate: '2024-01-01', endDate: '2025-01-01', premium: 1250.00, currency: 'CHF', status: 'active', broker: 'admin', commission: 125 },
    { id: 'v2', policyNumber: 'POL-002', clientId: 'c2', type: 'Bank', startDate: '2024-02-01', endDate: '2025-02-01', premium: 890.00, currency: 'CHF', status: 'pending', broker: 'admin', commission: 89 },
    { id: 'v3', policyNumber: 'POL-003', clientId: 'c1', type: 'Anlage', startDate: '2023-12-15', endDate: '2024-12-15', premium: 3400.00, currency: 'CHF', status: 'active', broker: 'admin', commission: 340 },
  ];

  getAll(): Observable<Contract[]> {
    return new Observable(o => { o.next(this.contracts); o.complete(); });
  }

  getById(id: string): Observable<Contract | undefined> {
    return new Observable(o => { o.next(this.contracts.find(c => c.id === id)); o.complete(); });
  }

  create(contract: Omit<Contract, 'id'>): Observable<Contract> {
    const newContract = { ...contract, id: String(Date.now()) };
    this.contracts.push(newContract);
    return new Observable(o => { o.next(newContract); o.complete(); });
  }
}
