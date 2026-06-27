import React, { useState } from 'react';
import { FileText, BarChart3, Download, Filter, Calendar, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KpiCard, StandardTable, StatusBadge } from '@/components/shared';

const REPORT_TYPES = [
  { key: 'commission', label: 'Provisionen', icon: TrendingUp, description: 'Provisionsübersicht nach Berater, Kunde und Periode' },
  { key: 'conversion', label: 'Conversion Funnel', icon: BarChart3, description: 'Anfragen → Angebote → Verträge Konversionsrate' },
  { key: 'commission', label: 'Neukunden', icon: Users, description: 'Neukundengewinnung und Akquisitions-KPIs' },
  { key: 'document', label: 'Dokumente', icon: FileText, description: 'Dokumentenerstellung und -verwaltung Status' },
  { key: 'pipeline', label: 'Pipeline', icon: BarChart3, description: 'Verkaufspipeline und Abschlüsse' },
  { key: 'performance', label: 'Berater Performance', icon: Users, description: 'Berater-Vergleich und Zielabweichungen' },
];

export default function Reports() {
  const [reportType, setReportType] = useState('commission');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  return (
    <div className="page-enter flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[hsl(var(--primary))] tracking-tight">Reports & Analytics</h1>
              <p className="text-xs text-muted-foreground">Erstellen und exportieren Sie Berichte aus allen Modul-Daten</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Report Type Selection */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Berichtstyp wählen</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {REPORT_TYPES.map((type) => (
              <button
                key={type.key}
                type="button"
                onClick={() => setReportType(type.key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md ${reportType === type.key ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:border-primary/40'}`}
              >
                <type.icon className={`w-5 h-5 ${reportType === type.key ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-medium text-center">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap items-end">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Von</label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Bis</label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 mt-1" />
              </div>
              <Button size="sm" variant="outline" className="gap-2 h-9">
                <Filter className="w-3.5 h-3.5" /> Filter anwenden
              </Button>
              <Button size="sm" className="gap-2 h-9">
                <Download className="w-3.5 h-3.5" /> Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sample Data Table */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Berichtsergebnisse — {REPORT_TYPES.find(t => t.key === reportType)?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <KpiCard label="Bericht erstellt" value="1" icon={Calendar} color="blue" />
              <div className="text-sm text-muted-foreground">
                <p>{REPORT_TYPES.find(t => t.key === reportType)?.description}</p>
                <p className="mt-2 text-xs">Implementieren Sie die Datenbindung für diesen Berichtstyp.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
