import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommissionService } from './services/commission.service';

@Component({
  selector: 'app-commission-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">Provisionen</h1>
      <div class="flex gap-2 mb-4">
        <select class="border rounded-lg px-3 py-2 text-sm" (change)="filterByType($event)">
          <option value="">Alle Typen</option>
          <option value="newbusiness">Neugeschäft</option>
          <option value="renewal">Verlängerung</option>
          <option value="bonus">Bonus</option>
        </select>
      </div>
      <div class="bg-white rounded-xl border overflow-hidden">
        <div class="divide-y">
          <div *ngFor="let c of commissions()" class="p-4 hover:bg-gray-50 flex items-center justify-between">
            <div>
              <p class="font-medium">{{ c.customer_name }}</p>
              <p class="text-sm text-gray-500">{{ c.provider }} • {{ c.type }}</p>
            </div>
            <div>
              <p class="font-semibold">{{ c.total | number:'1.0-2' }} €</p>
              <p class="text-xs text-gray-500">{{ c.date | date:'dd.MM.yyyy' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CommissionListPage implements OnInit {
  commissions = signal<any[]>([]);
  filter = '';

  constructor(private service: CommissionService) {}

  ngOnInit(): void {
    this.service.getAll().subscribe({
      next: (res: any) => this.commissions.set(res || []),
    });
  }

  filterByType(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.filter = val;
  }
}