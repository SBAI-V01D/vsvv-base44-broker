import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { avaai } from '@/api/avaaiClient'
import { Plus, Search, Lock, CheckCircle2 } from 'lucide-react'
import PageHeader from '../components/shared/PageHeader'
import StatusBadge from '../components/shared/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'

const statusLabels = {
  open: 'Offen',
  closing: 'Wird abgeschlossen',
  closed: 'Abgeschlossen',
  locked: 'Gesperrt',
}

export default function FinancePeriods() {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['finance_periods'],
    queryFn: () => avaai.entities.FinancePeriod.list('-start_date', 200),
  })

  const createMutation = useMutation({
    mutationFn: (data) => avaai.entities.FinancePeriod.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance_periods'] }); setEditing(null); toast({ title: 'Periode erstellt' }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => avaai.entities.FinancePeriod.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance_periods'] }); setEditing(null); toast({ title: 'Gespeichert' }) },
  })

  const filtered = periods.filter(p =>
    `${p.name || ''} ${p.period_type || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader title="Finanz-Perioden" subtitle={`${periods.length} Perioden`}>
        <Button onClick={() => setEditing({ start_date: new Date().toISOString().split('T')[0], end_date: '' })}><Plus className="w-4 h-4 mr-1" /> Neue Periode</Button>
      </PageHeader>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {['open', 'closing', 'closed', 'locked'].map(status => (
          <Card key={status}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{statusLabels[status]}</p>
            <p className="text-2xl font-bold">{periods.filter(p => p.status === status).length}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Ende</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Keine Perioden</TableCell></TableRow>
              ) : filtered.map(period => (
                <TableRow key={period.id}>
                  <TableCell className="font-medium">{period.name}</TableCell>
                  <TableCell className="text-sm">{period.start_date ? format(new Date(period.start_date), 'dd.MM.yyyy') : '–'}</TableCell>
                  <TableCell className="text-sm">{period.end_date ? format(new Date(period.end_date), 'dd.MM.yyyy') : '–'}</TableCell>
                  <TableCell><span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100">{period.period_type || 'monthly'}</span></TableCell>
                  <TableCell><StatusBadge status={period.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {period.status === 'closed' && (
                        <Button variant="ghost" size="sm" onClick={() => updateMutation.mutate({ id: period.id, data: { status: 'locked' } })} title="Sperren"><Lock className="w-4 h-4" /></Button>
                      )}
                      {period.status === 'open' && (
                        <Button variant="ghost" size="sm" onClick={() => updateMutation.mutate({ id: period.id, data: { status: 'closing' } })} title="Abschliessen"><CheckCircle2 className="w-4 h-4" /></Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setEditing(period)}>Bearbeiten</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? 'Periode bearbeiten' : 'Neue Periode'}</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const data = {
                name: editing.name,
                start_date: new Date(editing.start_date).toISOString(),
                end_date: editing.end_date ? new Date(editing.end_date).toISOString() : undefined,
                period_type: editing.period_type || 'monthly',
                status: editing.status || 'open',
              }
              if (editing.id) updateMutation.mutate({ id: editing.id, data })
              else createMutation.mutate(data)
            }} className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={editing.name || ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} required placeholder="z.B. Juli 2024" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Startdatum *</Label>
                  <Input type="date" value={editing.start_date ? (editing.start_date instanceof Date ? format(editing.start_date, 'yyyy-MM-dd') : editing.start_date.split('T')[0]) : ''} onChange={e => setEditing(p => ({ ...p, start_date: e.target.value }))} required />
                </div>
                <div>
                  <Label>Enddatum</Label>
                  <Input type="date" value={editing.end_date ? (editing.end_date instanceof Date ? format(editing.end_date, 'yyyy-MM-dd') : editing.end_date.split('T')[0]) : ''} onChange={e => setEditing(p => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Typ</Label>
                  <select value={editing.period_type || 'monthly'} onChange={e => setEditing(p => ({ ...p, period_type: e.target.value }))} className="w-full text-sm border border-input rounded-lg px-3 py-2">
                    {['monthly', 'quarterly', 'yearly'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Status</Label>
                  <select value={editing.status || 'open'} onChange={e => setEditing(p => ({ ...p, status: e.target.value }))} className="w-full text-sm border border-input rounded-lg px-3 py-2">
                    {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Abbrechen</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Speichern</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
