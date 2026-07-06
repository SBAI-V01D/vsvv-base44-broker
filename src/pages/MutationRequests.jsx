import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { avaai } from '@/api/avaaiClient'
import { Search, CheckCircle2, XCircle } from 'lucide-react'
import PageHeader from '../components/shared/PageHeader'
import StatusBadge from '../components/shared/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'

const statusLabels = {
  requested: 'Beantragt',
  in_review: 'In Prüfung',
  approved: 'Genehmigt',
  rejected: 'Abgelehnt',
  completed: 'Abgeschlossen',
}

const typeLabels = {
  address_change: 'Adressänderung',
  tariff_change: 'Tarifwechsel',
  franchise_change: 'Franchise-Änderung',
  modality_change: 'Modellwechsel',
  supplement: 'Zusatzversicherung',
  cancellation: 'Kündigung',
  other: 'Sonstiges',
}

export default function MutationRequests() {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: mutations = [], isLoading } = useQuery({
    queryKey: ['mutation_requests'],
    queryFn: () => avaai.entities.MutationRequest.list('-created_at', 500),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => avaai.entities.MutationRequest.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mutation_requests'] }); setEditing(null); toast({ title: 'Gespeichert' }) },
  })

  const filtered = mutations.filter(m =>
    `${m.customer_name || ''} ${m.mutation_type || ''} ${m.description || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const counts = mutations.reduce((acc, m) => { acc[m.status] = (acc[m.status] || 0) + 1; return acc }, {})

  return (
    <div>
      <PageHeader title="Vertragsänderungen" subtitle={`${mutations.length} Mutationen`} />

      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="flex items-center gap-1.5 bg-white border border-border rounded-full px-3 py-1.5 text-xs font-medium">
            <StatusBadge status={status} />
            <span className="text-muted-foreground ml-1">{count}</span>
          </div>
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
                <TableHead>Kunde</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Keine Mutationen</TableCell></TableRow>
              ) : filtered.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-sm">{m.customer_name || '–'}</TableCell>
                  <TableCell><span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100">{typeLabels[m.mutation_type] || m.mutation_type}</span></TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{m.description || '–'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.created_at ? format(new Date(m.created_at), 'dd.MM.yyyy') : '–'}</TableCell>
                  <TableCell><StatusBadge status={m.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {m.status === 'requested' && (
                        <>
                          <Button variant="ghost" size="sm" className="text-green-600" onClick={() => updateMutation.mutate({ id: m.id, data: { status: 'approved' } })} title="Genehmigen"><CheckCircle2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => updateMutation.mutate({ id: m.id, data: { status: 'rejected' } })} title="Ablehnen"><XCircle className="w-4 h-4" /></Button>
                        </>
                      )}
                      {m.status === 'approved' && (
                        <Button variant="ghost" size="sm" onClick={() => updateMutation.mutate({ id: m.id, data: { status: 'completed' } })} title="Abschliessen"><CheckCircle2 className="w-4 h-4 text-blue-600" /></Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setEditing(m)}>Details</Button>
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
          <DialogHeader><DialogTitle>Mutationsdetails</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={(e) => {
              e.preventDefault()
              updateMutation.mutate({ id: editing.id, data: { reviewer_notes: editing.reviewer_notes, status: editing.status } })
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Kunde:</span> <span className="font-medium">{editing.customer_name}</span></div>
                <div><span className="text-muted-foreground">Typ:</span> <span>{typeLabels[editing.mutation_type] || editing.mutation_type}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={editing.status} /></div>
                <div><span className="text-muted-foreground">Datum:</span> <span>{editing.created_at ? format(new Date(editing.created_at), 'dd.MM.yyyy') : '–'}</span></div>
              </div>
              {editing.description && (
                <div className="text-sm p-3 bg-slate-50 rounded-lg"><span className="text-muted-foreground">Beschreibung:</span> {editing.description}</div>
              )}
              <div>
                <Label>Status</Label>
                <select value={editing.status} onChange={e => setEditing(p => ({ ...p, status: e.target.value }))} className="w-full text-sm border border-input rounded-lg px-3 py-2">
                  {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <Label>Prüfvermerk</Label>
                <Textarea value={editing.reviewer_notes || ''} onChange={e => setEditing(p => ({ ...p, reviewer_notes: e.target.value }))} rows={3} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Schliessen</Button>
                <Button type="submit" disabled={updateMutation.isPending}>Speichern</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
