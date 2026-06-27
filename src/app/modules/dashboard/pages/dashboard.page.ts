import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Dashboard</h1>
          <p class="text-sm text-gray-500 mt-1">Willkommen zurück! Hier ist ein Überblich über ihre Geschäft.</p>
        </div>
      </div>

      <!-- KPI Widgets -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="p-2 rounded-lg bg-blue-100">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          </div>
          <div class="text-3xl font-bold">126</div>
          <div class="text-sm text-gray-500 mt-1">Kunden gesamt</div>
          <div class="mt-2 text-sm text-blue-600">+12% vs. vor. Monat</div>
        </div>

        <div class="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="p-2 rounded-lg bg-green-100">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          </div>
          <div class="text-3xl font-bold">CHF 356'200</div>
          <div class="text-sm text-gray-500 mt-1">Prämienumsatz</div>
          <div class="mt-2 text-sm text-blue-600">+8.3% vs. vor. Monat</div>
        </div>

        <div class="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="p-2 rounded-lg bg-yellow-100">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          </div>
          <div class="text-3xl font-bold">CHF 12'840</div>
          <div class="text-sm text-gray-500 mt-1">Provisionen</div>
          <div class="mt-2 text-sm text-blue-600">+5.1% vs. vor. Monat</div>
        </div>

        <div class="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="p-2 rounded-lg bg-purple-100">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
          </div>
          <div class="text-3xl font-bold">8.7%</div>
          <div class="text-sm text-gray-500 mt-1">Konversionsrate</div>
          <div class="mt-2 text-sm text-red-600">-2.3% vs. vor. Monat</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Neukunden Graph -->
        <div class="bg-white rounded-xl p-6 border shadow-sm">
          <h3 class="text-lg font-semibold mb-4">Neukunden (Neukundenzuwachs)</h3>
          <div class="flex items-end gap-2 h-48">
            <div class="flex-1 flex flex-col items-center">
              <div class="flex gap-1 items-end w-full">
                <div class="w-1/2 bg-green-400 rounded-t" [style.height.%]="30"></div>
                <div class="w-1/2 bg-blue-400 rounded-t" [style.height.%]="15"></div>
              </div>
              <div class="text-xs text-gray-500 mt-2">M</div>
            </div>
            <div class="flex-1 flex flex-col items-center">
              <div class="flex gap-1 items-end w-full">
                <div class="w-1/2 bg-green-400 rounded-t" [style.height.%]="60"></div>
                <div class="w-1/2 bg-blue-400 rounded-t" [style.height.%]="20"></div>
              </div>
              <div class="text-xs text-gray-500 mt-2">F</div>
            </div>
            <div class="flex-1 flex flex-col items-center">
              <div class="flex gap-1 items-end w-full">
                <div class="w-1/2 bg-green-400 rounded-t" [style.height.%]="80"></div>
                <div class="w-1/2 bg-blue-400 rounded-t" [style.height.%]="25"></div>
              </div>
              <div class="text-xs text-gray-500 mt-2">M</div>
            </div>
            <div class="flex-1 flex flex-col items-center">
              <div class="flex gap-1 items-end w-full">
                <div class="w-1/2 bg-green-400 rounded-t" [style.height.%]="95"></div>
                <div class="w-1/2 bg-blue-400 rounded-t" [style.height.%]="30"></div>
              </div>
              <div class="text-xs text-gray-500 mt-2">A</div>
            </div>
            <div class="flex-1 flex flex-col items-center">
              <div class="flex gap-1 items-end w-full">
                <div class="w-1/2 bg-green-400 rounded-t" [style.height.%]="70"></div>
                <div class="w-1/2 bg-blue-400 rounded-t" [style.height.%]="35"></div>
              </div>
              <div class="text-xs text-gray-500 mt-2">M</div>
            </div>
            <div class="flex-1 flex flex-col items-center">
              <div class="flex gap-1 items-end w-full">
                <div class="w-1/2 bg-green-400 rounded-t" [style.height.%]="100"></div>
                <div class="w-1/2 bg-blue-400 rounded-t" [style.height.%]="40"></div>
              </div>
              <div class="text-xs text-gray-500 mt-2">F</div>
            </div>
          </div>
          <div class="flex items-center gap-4 mt-4 text-xs">
            <span class="w-2 h-2 bg-green-400 rounded-full"></span>Neukunde<span class="w-2 h-2 bg-blue-400 rounded-full"></span>Kunde<span class="flex-1"></span>Monat</div>
        </div>

        <!-- Provisionsumsatz Graph -->
        <div class="bg-white rounded-xl p-6 border shadow-sm">
          <h3 class="text-lg font-semibold mb-4">Provisionsumsatz</h3>
          <div class="flex items-end gap-2 h-48">
            <div class="flex-1 flex flex-col items-center">
              <div class="w-full bg-yellow-400 rounded-t" [style.height.%]="40"></div>
              <div class="text-xs text-gray-500 mt-2">Jan</div>
            </div>
            <div class="flex-1 flex flex-col items-center">
              <div class="w-full bg-yellow-400 rounded-t" [style.height.%]="55"></div>
              <div class="text-xs text-gray-500 mt-2">Feb</div>
            </div>
            <div class="flex-1 flex flex-col items-center">
              <div class="w-full bg-yellow-400 rounded-t" [style.height.%]="35"></div>
              <div class="text-xs text-gray-500 mt-2">Mrz</div>
            </div>
            <div class="flex-1 flex flex-col items-center">
              <div class="w-full bg-yellow-400 rounded-t" [style.height.%]="70"></div>
              <div class="text-xs text-gray-500 mt-2">Apr</div>
            </div>
            <div class="flex-1 flex flex-col items-center">
              <div class="w-full bg-yellow-400 rounded-t" [style.height.%]="85"></div>
              <div class="text-xs text-gray-500 mt-2">Mai</div>
            </div>
            <div class="flex-1 flex flex-col items-center">
              <div class="w-full bg-yellow-400 rounded-t" [style.height.%]="100"></div>
              <div class="text-xs text-gray-500 mt-2">Jun</div>
            </div>
          </div>
          <div class="text-xs text-gray-500 mt-4 text-center">CHF tausend (Provisionsumsatz)</div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button class="btn btn-white flex flex-col items-center p-4 gap-2">
          <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
          </div>
          <span>Kunden</span>
        </button>
        <button class="btn btn-white flex flex-col items-center p-4 gap-2">
          <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>n
          <span>Verträge</span>
        </button>
        <button class="btn btn-white flex flex-col items-center p-4 gap-2">
          <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          </div>
          <span>Ressourcen</span>
        </button>
        <button class="btn btn-white flex flex-col items-center p-4 gap-2">
          <div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <span>Provisionen</span>
        </button>
      </div>
    </div>
  `,
})
export class DashboardPage {}
