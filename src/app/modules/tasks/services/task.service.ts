import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignee: string;
  dueDate: string;
  createdDate: string;
  createdBy: string;
  customerId?: string;
  contractId?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private tasks: Task[] = [
    { id: 't1', title: 'Premium-Antrag prüfen', description: 'Dokumente für Kunden M. Müller prüfen', priority: 'high', status: 'pending', assignee: 'admin', dueDate: '2024-02-28', createdDate: '2024-02-20', createdBy: 'system' },
    { id: 't2', title: 'Neukundengespräch', description: 'Vorstellungsgespräch führen mit Prospekt', priority: 'medium', status: 'in_progress', assignee: 'admin', dueDate: '2024-03-05', createdDate: '2024-02-25', createdBy: 'admin' },
    { id: 't3', title: 'Police erneuern', description: 'Jährliche Police Verlängerung durchführen', priority: 'high', status: 'pending', assignee: 'admin', dueDate: '2024-03-10', createdDate: '2024-02-26', createdBy: 'admin' },
  ];

  getAll(): Observable<Task[]> {
    return new Observable(o => { o.next(this.tasks); o.complete(); });
  }

  getById(id: string): Observable<Task | undefined> {
    return new Observable(o => { o.next(this.tasks.find(t => t.id === id)); o.complete(); });
  }

  updateStatus(id: string, status: string): Observable<Task> {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.status = status as Task['status'];
      return new Observable(o => { o.next(task); o.complete(); });
    }
    return new Observable(o => { o.next(undefined as any); o.complete(); });
  }

  create(task: Omit<Task, 'id' | 'createdDate'>): Observable<Task> {
    const newTask = { ...task, id: String(Date.now()), createdDate: new Date().toISOString().split('T')[0] };
    this.tasks.push(newTask);
    return new Observable(o => { o.next(newTask); o.complete(); });
  }

  delete(id: string): Observable<void> {
    this.tasks = this.tasks.filter(t => t.id !== id);
    return new Observable(o => { o.next(); o.complete(); });
  }
}
