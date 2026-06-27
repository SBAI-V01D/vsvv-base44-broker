import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phone: string;
  address: string;
  zipCode: string;
  city: string;
  country: string;
  activePolicies: number;
  createdDate: string;
  status: 'active' | 'inactive' | 'lead';
  avatar?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private customers: Customer[] = [
    { id: 'c1', firstName: 'Anna', lastName: 'Müller', companyName: 'Müller AG', email: 'anna@example.com', phone: '+41 79 123 45 67', address: 'Bahnhofstrasse 1', zipCode: '8001', city: 'Zürich', country: 'CH', activePolicies: 3, createdDate: '2023-01-15', status: 'active' },
    { id: 'c2', firstName: 'Max', lastName: 'Mustermann', email: 'max@example.com', phone: '+41 79 987 65 43', address: 'Bundesplatz 5', zipCode: '3003', city: 'Bern', country: 'CH', activePolicies: 1, createdDate: '2023-03-22', status: 'active' },
    { id: 'c3', firstName: 'Hans', lastName: 'Wurst', email: 'hans@example.com', phone: '+41 79 111 22 33', address: 'Rue du Lac 10', zipCode: '1201', city: 'Genf', country: 'CH', activePolicies: 2, createdDate: '2023-05-10', status: 'lead' },
  ];

  getAll(): Observable<Customer[]> {
    return new Observable(o => { o.next(this.customers); o.complete(); });
  }

  create(customer: Omit<Customer, 'id' | 'createdDate' | 'activePolicies'>): Observable<Customer> {
    const newCustomer = { ...customer, id: String(Date.now()), createdDate: new Date().toISOString().split('T')[0], activePolicies: 0 };
    this.customers.push(newCustomer);
    return new Observable(o => { o.next(newCustomer); o.complete(); });
  }
}
