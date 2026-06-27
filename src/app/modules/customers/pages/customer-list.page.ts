import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService, Customer } from '../../../core/services/api.service';

/**
 * Customer List Page
 *
 * Replaces Customers.jsx — a premium Relationship Intelligence workspace.
 * Displays customers with search, scoring, and segmentation.
 */
@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-list.page.html',
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .page-header { padding: 1.25rem 1.5rem 0; display: flex; justify-content: space-between; align-items: center; }
    .search-area { padding: 0 1.5rem; border-bottom: 1px solid var(--border-light); }
    .table-area { flex: 1; overflow: auto; padding: 0; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; padding: 4rem 1.5rem; text-align: center; }
    .loading-overlay { display: flex; align-items: center; justify-content: center; flex: 1; padding: 4rem; }
  `]
})
export class CustomerListPage implements OnInit {
  customers = signal<Customer[]>([]);
  loading = signal(false);
  searchQuery = signal('');
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = 25;
  viewMode = signal<'table' | 'list'>('table');

  filteredCustomers = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.customers();
    return this.customers().filter(c =>
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  get customerName() {
    return (c: Customer) => `${c.firstName} ${c.lastName}`;
  }

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.api.getCustomers().subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : [];
        this.customers.set(data);
        this.totalCount.set(data.length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectCustomer(id: string): void {
    this.router.navigate([`/crm/customers/${id}`]);
  }

  addNewCustomer(): void {
    this.router.navigate(['/app/customers', 'new']);
  }
}
