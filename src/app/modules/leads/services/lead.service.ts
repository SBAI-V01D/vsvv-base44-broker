import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  assignedTo: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  value: number;
  createdDate: string;
  conversionProbability: number;
}

@Injectable({ providedIn: 'root' })
export class LeadService {
  private leads: Lead[] = [
    { id: 'l1', name: 'Max Mustermann', email: 'max@example.com', phone: '+41 79 123 45 67', source: 'Website', assignedTo: 'admin', status: 'new', value: 15000, createdDate: '2024-02-01', conversionProbability: 85 },
    { id: 'l2', name: 'Anna Müller', email: 'anna@example.com', phone: '+41 79 987 65 43', source: 'Empfehlung', assignedTo: 'admin', status: 'qualified', value: 22000, createdDate: '2024-01-20', conversionProbability: 60 },
    { id: 'l3', name: 'Hans Wurst', email: 'hans@example.com', phone: '+41 79 111 22 33', source: 'Kaltakquise', assignedTo: 'admin', status: 'contacted', value: 8000, createdDate: '2024-02-10', conversionProbability: 30 },
  ];

  getAll(): Observable<Lead[]> {
    return new Observable(o => { o.next(this.leads); o.complete(); });
  }

  getById(id: string): Observable<Lead | undefined> {
    return new Observable(o => { o.next(this.leads.find(l => l.id === id)); o.complete(); });
  }

  create(lead: Omit<Lead, 'id' | 'createdDate'>): Observable<Lead> {
    const newLead = { ...lead, id: String(Date.now()), createdDate: new Date().toISOString().split('T')[0] };
    this.leads.push(newLead);
    return new Observable(o => { o.next(newLead); o.complete(); });
  }

  moveStage(id: string, stage: string): Observable<Lead> {
    const lead = this.leads.find(l => l.id === id);
    if (lead) {
      lead.status = stage as Lead['status'];
      return new Observable(o => { o.next(lead); o.complete(); });
    }
    return new Observable(o => { o.next(undefined as any); o.complete(); });
  }
}
