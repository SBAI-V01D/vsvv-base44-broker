import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';

/**
 * `ApiService`
 *
 * Base HTTP service with token injection, error handling, and
 * automatic redirect on 401 responses.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthStateService);

  private readonly API_BASE = '/api';

  // ------ Generic CRUD helpers ------
  get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.request<T>('GET', path, { params });
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.request<T>('POST', path, { body });
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.request<T>('PUT', path, { body });
  }

  delete(path: string): Observable<void> {
    return this.request<void>('DELETE', path);
  }

  private patch<T>(path: string, body?: unknown): Observable<T> {
    return this.request<T>('PATCH', path, { body });
  }

  // ------ Customer ------
  getCustomers(params?: HttpParams): Observable<Customer[]> {
    return this.get<Customer[]>(`${this.API_BASE}/customers`, params);
  }

  getCustomerById(id: string): Observable<Customer> {
    return this.get<Customer>(`${this.API_BASE}/customers/${id}`);
  }

  createCustomer(body: Partial<Customer>): Observable<Customer> {
    return this.post<Customer>(`${this.API_BASE}/customers`, body);
  }

  updateCustomer(id: string, body: Partial<Customer>): Observable<Customer> {
    return this.put<Customer>(`${this.API_BASE}/customers/${id}`, body);
  }

  // Contracts
  getContracts(): Observable<Contract[]> {
    return this.get<Contract[]>(`${this.API_BASE}/contracts`);
  }
  createContract(body: Partial<Contract>): Observable<Contract> {
    return this.post<Contract>(`${this.API_BASE}/contracts`, body);
  }

  // Applications
  getApplications(): Observable<Application[]> {
    return this.get<Application[]>(`${this.API_BASE}/applications`);
  }
  getApplicationsByStatus(status: string): Observable<Application[]> {
    return this.get<Application[]>(
      `${this.API_BASE}/applications`,
      new HttpParams().set('status', status)
    );
  }
  createApplication(body: Partial<Application>): Observable<Application> {
    return this.post<Application>(`${this.API_BASE}/applications`, body);
  }
  updateApplicationStatus(id: string, status: string): Observable<Application> {
    return this.patch<Application>(
      `${this.API_BASE}/applications/${id}/status`,
      { status }
    );
  }

  // Commissions
  getCommissions(): Observable<Commission[]> {
    return this.get<Commission[]>(`${this.API_BASE}/commissions`);
  }

  // Documents
  getDocuments(): Observable<Document[]> {
    return this.get<Document[]>(`${this.API_BASE}/documents`);
  }
  uploadDocument(customerId: string, file: File): Observable<Document> {
    const fd = new FormData();
    fd.append('file', file);
    return this.post<Document>(
      `${this.API_BASE}/documents?entity_type=Customer&entity_id=${customerId}`,
      fd
    );
  }

  // Leads
  getLeads(): Observable<Lead[]> {
    return this.get<Lead[]>(`${this.API_BASE}/leads`);
  }

  // Tasks
  getTasks(): Observable<Task[]> {
    return this.get<Task[]>(`${this.API_BASE}/tasks?status=open`);
  }

  // Dashboard
  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.get<DashboardMetrics>(`${this.API_BASE}/dashboard/metrics`);
  }

  // Reports
  getReportTemplates(): Observable<ReportTemplate[]> {
    return this.get<ReportTemplate[]>(`${this.API_BASE}/reports`);
  }
  generateReport(reportType: string): Observable<ReportResult> {
    return this.post<ReportResult>(
      `${this.API_BASE}/reports/generate`,
      { type: reportType }
    );
  }

  // Migration
  migrateCustomers(data: Customer[]): Observable<{ migrated: number }> {
    return this.post<{ migrated: number }>(
      `${this.API_BASE}/migration/customers`,
      { data }
    );
  }

  // Internal
  private request<T>(
    method: 'GET'|'POST'|'PUT'|'DELETE'|'PATCH',
    path: string,
    opts?: { params?: HttpParams; body?: unknown }
  ): Observable<T> {
    let url = this.resolvePath(path);
    let headers = this.buildHeaders();
    if (method === 'PATCH') {
      // explicit PATCH
      return this.http.request<T>(method, url, {
        headers, body: opts?.body
      }).pipe(catchError(e => this.handleErr(e)));
    }
    const params = opts?.params ?? new HttpParams();
    const hOpts: any = { headers, params };
    if (opts?.body && method !== 'GET' && method !== 'DELETE') {
      hOpts.body = opts.body;
    }
    return this.http.request<T>(method, url, hOpts).pipe(
      catchError(e => this.handleErr(e))
    );
  }

  private resolvePath(p: string): string {
    return p.startsWith('http') ? p : `${this.API_BASE}${p}`;
  }
  private buildHeaders(): HttpHeaders {
    const t = this.auth.getAccessToken();
    let h = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (t) h = h.set('Authorization', `Bearer ${t}`);
    return h;
  }
  private handleErr(e: any): Observable<never> {
    if (e.status === 401) this.auth.navigateToLogin();
    console.error('API Error:', e);
    return throwError(() => e);
  }
}

// ===== Entity Types =====

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  company_id?: string;
  status?: string;
  score?: number;
  created_date?: string;
  archived?: boolean;
  taskCount?: number;
  contractCount?: number;
  documentCount?: number;
}

export interface Contract {
  id: string;
  customer_id: string;
  customerName?: string;
  start_date?: string;
  end_date?: string;
  premium?: number;
  commission?: number;
  status?: string;
  type?: string;
  versicherung?: string;
  sparte?: string;
  created_date?: string;
  archived?: boolean;
}

export interface Application {
  id: string;
  customer_id: string;
  type?: string;
  status?: string;
  progress?: number;
  sparte?: string;
  created_date?: string;
  applicant_name?: string;
  versicherung?: string;
}

export interface Commission {
  id: string;
  contract_id?: string;
  customer_id?: string;
  customer_name?: string;
  amount?: number;
  type?: 'newbusiness' | 'renewal' | 'bonus';
  period_start?: string;
  period_end?: string;
  broker_id?: string;
  broker_name?: string;
  status?: string;
}

export interface Document {
  id: string;
  filename: string;
  entity_type: string;
  entity_id: string;
  created_date?: string;
  customer_id?: string;
  customer_name?: string;
}

export interface Lead {
  id: string;
  name?: string;
  email?: string;
  source?: string;
  status?: string;
  created_date?: string;
  assignedBrokerId?: string;
}

export interface Task {
  id: string;
  customer_id?: string;
  customer_name?: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority?: string;
  due_date?: string;
  created_date?: string;
  assignee_id?: string;
}

export interface DashboardMetrics {
  leads: number;
  renewals: number;
  opportunities: number;
  tasks: number;
  risks: number;
  activeContracts: number;
  monthlyPremium: number;
  monthlyCommission: number;
  totalCustomers: number;
  conversionRate: number;
}

export interface ReportTemplate {
  key: string;
  label: string;
  description: string;
}

export interface ReportResult {
  type: string;
  data: unknown;
  generated_at: string;
}
