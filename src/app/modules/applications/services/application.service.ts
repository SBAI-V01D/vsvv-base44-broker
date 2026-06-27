import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Application {
  id: string;
  applicantName: string;
  type: 'Hausrat' | 'Recht' | 'Unfall' | 'KFZ' | 'Reiserisiko' | 'Krank' | 'VR' | 'AV' | 'UV' | 'Sach';
  amount: number;
  provider: string;
  createdAt: string;
  status: 'new' | 'in_progress' | 'pending_docs' | 'approved' | 'rejected' | 'deleted';
}

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private applications: Application[] = [
    { id: 'a1', applicantName: 'Anna Müller', type: 'Hausrat', amount: 500000, provider: 'Zurich', createdAt: '2024-01-20', status: 'approved' },
    { id: 'a2', applicantName: 'Max Mustermann', type: 'Recht', amount: 50000, provider: 'Helvetia', createdAt: '2024-02-05', status: 'pending_docs' },
  ];

  getAll(): Observable<Application[]> {
    return new Observable(o => { o.next(this.applications); o.complete(); });
  }

  create(app: Omit<Application, 'id' | 'status' | 'createdAt'>): Observable<Application> {
    const newApp = { ...app, id: String(Date.now()), status: 'new', createdAt: new Date().toISOString().split('T')[0] };
    this.applications.push(newApp);
    return new Observable(o => { o.next(newApp); o.complete(); });
  }
}
