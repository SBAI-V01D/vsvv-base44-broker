import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService, ReportConfig } from '../services/report.service';

@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Reports &amp; Analysen</h1>
          <p class="text-sm text-gray-500 mt-1">Erstellen Sie Berichte und visualisieren Sie Ihre Daten</p>
        </div>
        <button type="button" class="btn btn-primary text-sm">Neuer Bericht</button>
      </div>

      <!-- Quick Actions -->
      <div class="flex gap-3 overflow-x-auto pb-2">
        <button class="flex shrink-0 items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 text-sm">
          <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          Umsatzübersicht
        </button>
        <button class="flex shrink-0 items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 text-sm">
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          Commission Tracking
        </button>
        <button class="flex shrink-0 items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 text-sm">
          <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          Conversion Rate
        </button>
        <button type="button" routerLink="/app/report/custom" class="flex shrink-0 items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 text-sm">
          <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          Custom Report
        </button>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white rounded-xl p-6 border shadow-sm">
          <h3 class="font-semibold mb-4">Umsatzverlauf</h3>
          <div class="bg-gray-50 h-64 flex items-center">
            <div class="grid grid-flow-col grid-rows-6 gap-1 items-end h-48 w-full px-4">
              <ng-container *ngFor="let m of monthlyData(); let i = index">
                <div class="bg-blue-500 rounded-t min-h-[20px]" [style.height.%]="m.height"></div>
              </ng-container>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-6 border shadow-sm">
          <h3 class="font-semibold mb-4">Top Leads</h3>
          <div class="space-y-3">
            <div class="flex justify-between text-sm"><span class="text-gray-600">Company A</span><span class="font-bold text-green-600">98%</span></div>
            <div class="flex justify-between text-sm"><span class="text-gray-600">Company B</span><span class="font-bold text-green-600">92%</span></div>
            <div class="flex justify-between text-sm"><span class="text-gray-600">Company C</span><span class="font-bold text-yellow-600">88%</span></div>
            <div class="flex justify-between text-sm"><span class="text-gray-600">Company D</span><span class="font-bold text-yellow-600">75%</span></div>
            <div class="flex justify-between text-sm"><span class="text-gray-600">Company E</span><span class="font-bold text-gray-600">62%</span></div>
          </div>
        </div>
      </div>
  `,
})
export class ReportDashboardPage implements OnInit {
  protected monthlyData = () => [
    { height: '40%' }, { height: '55%' }, { height: '70%' }, { height: '60%' },
    { height: '80%' }, { height: '95%' }, { height: '85%' }, { height: '90%' },
    { height: '75%' }, { height: '65%' }, { height: '100%' }, { height: '92%' },
  ];
  ngOnInit(): void {}
}
