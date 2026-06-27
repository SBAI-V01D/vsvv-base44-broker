import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Task } from '../../../core/services/api.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">Aufgaben</h1>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">Offen</p>
          <div class="mt-2 flex flex-col gap-2">
            <div *ngFor="let t of openTasks()" class="bg-white border rounded-lg p-3 hover:shadow-sm">
              <p class="font-medium text-sm">{{ t.title }}</p>
              <p class="text-xs text-gray-500">{{ t.customer_name || 'Ohne Kunde' }}</p>
            </div>
            <div *ngIf="openTasks().length === 0" class="text-xs text-gray-400 text-center py-2">Keine offenen Aufgaben</div>
          </div>
        </div>
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">In Bearbeitung</p>
          <div class="mt-2 flex flex-col gap-2">
            <div *ngFor="let t of inProgressTasks()" class="bg-white border rounded-lg p-3">
              <p class="font-medium text-sm">{{ t.title }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">Erledigt</p>
          <p class="text-2xl font-bold text-green-600">{{ completedCount() }}</p>
        </div>
        <div class="bg-white rounded-xl border p-4">
          <p class="text-sm text-gray-500">Verfallen</p>
          <p class="text-2xl font-bold text-red-600">{{ overdueCount() }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl border overflow-hidden">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="font-semibold">Alle Aufgaben</h2>
          <button class="btn btn-primary text-xs" (click)="createTask()">+ Neue Aufgabe</button>
        </div>
        <div class="divide-y">
          <div *ngFor="let t of allTasks()" class="p-4 hover:bg-gray-50 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span [class]="priorityBadge(t.priority)">{{ t.priority || 'normal' }}</span>
              <div>
                <p class="font-medium">{{ t.title }}</p>
                <p class="text-sm text-gray-500">{{ t.customer_name || '—' }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-outline text-xs" (click)="moveToState(t, 'in_progress')">Start</button>
              <button class="btn btn-outline text-green-600" (click)="moveToState(t, 'completed')">✓</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .priority-normal { @apply bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs; }
    .priority-high { @apply bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs; }
    .priority-low { @apply bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs; }
  `]
})
export class TaskListPage implements OnInit {
  tasks = signal<Task[]>([]);

  openTasks = signal<Task[]>([]);
  inProgressTasks = signal<Task[]>([]);
  completedCount = signal(0);
  overdueCount = signal(0);
  allTasks = signal<Task[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getTasks().subscribe({
      next: (res: any) => this.setTasks(res || []),
    });
  }

  setTasks(data: Task[]): void {
    this.tasks.set(data);
    this.openTasks.set(data.filter(t => t.status === 'open'));
    this.inProgressTasks.set(data.filter(t => t.status === 'in_progress'));
    const completed = data.filter(t => t.status === 'completed');
    this.completedCount.set(completed.length);
    const now = new Date();
    this.overdueCount.set(
      data.filter((t: any) => t.due_date && new Date(t.due_date) < now).length + completed.length
    );
    this.allTasks.set(data);
  }

  moveToState(task: Task, state: string): void {
    const idx = this.tasks().indexOf(task);
    if (idx !== -1) {
      const updated = [...this.tasks()];
      updated[idx] = { ...task, status: state as Task['status'] };
      this.tasks.set(updated);
    }
  }

  createTask(): void {
    this.api.post('/api/tasks', { title: 'Neue Aufgabe', description: '', priority: 'normal', status: 'open' }).subscribe(
      () => this.api.getTasks().subscribe((res: any) => this.setTasks(res || []))
    );
  }

  priorityBadge(priority?: string): string {
    return 'priority-' + (priority || 'normal');
  }
}