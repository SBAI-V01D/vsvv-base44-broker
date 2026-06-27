import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TaskService, Task } from '../services/task.service';

@Component({
  selector: 'app-tasks-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Aufgaben</h1>
          <p class="text-sm text-gray-500 mt-1">Ihre Aufgabenliste und deren Status</p>
        </div>
        <button class="btn btn-primary text-sm">Neue Aufgabe</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="text-sm text-gray-500">Offen</div>
          <div class="text-2xl font-bold mt-1">{{ openTasks() }}</div>
        </div>
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="text-sm text-gray-500">In Bearbeitung</div>
          <div class="text-2xl font-bold mt-1">{{ inProgressTasks() }}</div>
        </div>
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="text-sm text-gray-500">Geschlossen</div>
          <div class="text-2xl font-bold mt-1 text-green-600">{{ completedTasks() }}</div>
        </div>
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="text-sm text-gray-500">Überfällig</div>
          <div class="text-2xl font-bold mt-1 text-red-600">1</div>
        </div>
      </div>

      <div class="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Aufgabe</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Prio</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Status</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Fällig am</th>
              <th class="px-6 py-3 text-left font-medium text-gray-500">Aktionen</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let task of tasks()" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="font-medium">{{ task.title }}</div>
                <div class="text-xs text-gray-500">{{ task.description }}</div>
              </td>
              <td class="px-6 py-4">
                <span [class]="'px-2 py-1 rounded text-xs ' + priorityClass(task.priority)">{{ priorityLabel(task.priority) }}</span>
              </td>
              <td class="px-6 py-4">
                <span [class]="'px-2 py-1 rounded text-xs ' + statusClass(task.status)">{{ statusLabel(task.status) }}</span>
              </td>
              <td class="px-6 py-4 text-gray-500">{{ task.dueDate }}</td>
              <td class="px-6 py-4 flex gap-2">
                <button class="text-blue-600 hover:text-blue-800 p-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 013.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class TasksDashboardPage implements OnInit {
  private taskService = inject(TaskService);
  protected tasks = signal<Task[]>([]);

  protected openTasks(): number { return this.tasks().filter(t => t.status === 'pending').length; }
  protected inProgressTasks(): number { return this.tasks().filter(t => t.status === 'in_progress').length; }
  protected completedTasks(): number { return this.tasks().filter(t => t.status === 'completed').length; }

  ngOnInit(): void {
    this.taskService.getAll().subscribe({ next: (data) => this.tasks.set(data) });
  }

  protected priorityClass(p: string): string {
    if (p === 'high') return 'bg-red-100 text-red-700';
    if (p === 'medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-blue-100 text-blue-700';
  }

  protected priorityLabel(p: string): string {
    if (p === 'high') return 'Hoch';
    if (p === 'medium') return 'Mittel';
    return 'Niedrig';
  }

  protected statusClass(s: string): string {
    if (s === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (s === 'in_progress') return 'bg-blue-100 text-blue-700';
    if (s === 'completed') return 'bg-green-100 text-green-700';
    return 'bg-red-100 text-red-700';
  }

  protected statusLabel(s: string): string {
    if (s === 'pending') return 'Offen';
    if (s === 'in_progress') return 'In Bearbeitung';
    if (s === 'completed') return 'Geschlossen';
    return 'Storniert';
  }
}
