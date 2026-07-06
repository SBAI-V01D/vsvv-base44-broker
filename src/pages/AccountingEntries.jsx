import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { avaai } from '@/api/avaaiClient'
import { Plus, Search } from 'lucide-react'
import PageHeader from '../components/shared/PageHeader'
import StatusBadge from '../components/shared/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'

const statusLabels = {
  pending: 'Pending',
  booked: 'Gebucht',
  paid: 'Bezahlt',
  cancelled: 'Storniert',
}

const typeLabels = {
  courtage: 'Courtage',
  provision: 'Provision',
  fee: 'Gebühr',
  storno: 'Storno',
}

export default function AccountingEntries() {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['accounting_entries'],
    queryFn: () => avaai.entities.AccountingEntry.list('-created_at', 500),
  })

  const createMutation = useMutation({
    mutationFn: (data) => avaai.entities.AccountingEntry.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounting_entries'] }); setEditing(null); toast({ title: 'Buchung erstellt' }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => avaai.entities.AccountingEntry.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounting_entries'] }); setEditing(null); toast({ title: 'Gespeichert' }) },
  })

  const filtered = entries.filter(e =>
    `${e.reference_number || ''} ${e.description || ''} ${e.category || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const totalPending = entries.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.amount || 0), 0)
  const totalBooked = entries.filter(e => e.status === 'booked').reduce((s, e) => s + Number(e.amount || 0), 0)
  const totalPaid = entries.filter(e => e.status === 'paid').reduce((s, e) => s + Number(e.amount || 0), 0)

  const formatCHF = (v) => `CHF ${(v || 0).toLocaleString('de-CH', { minimumFractionDigits: 2 })}`

  return (
    <div>
      <PageHeader title="Buchhaltung" subtitle={`${entries.length} Buchungen`}>
        <Button onClick={() => setEditing({})}><Plus className="w-4 h-4 mr-1" /> Neue Buchung</Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Offen (Pending)</span>
          <span className="text-lg font-bold text-amber-600">{formatCHF(totalPending)}</span>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Gebucht</span>
          <span className="text-lg font-bold text-blue-600">{formatCHF(totalBooked)}</span>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Bezahlt</span>
          <span className="text-lg font-bold text-green-600">{formatCHF(totalPaid)}</span>
        </CardContent></Card>
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
                <TableHead>Datum</TableHead>
                <TableHead>Referenz</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Keine Buchungen</TableCell></TableRow>
              ) : filtered.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm">{entry.entry_date ? format(new Date(entry.entry_date), 'dd.MM.yyyy') : '–'}</TableCell>
                  <TableCell className="text-sm font-mono">{entry.reference_number || '–'}</TableCell>
                  <TableCell className="text-sm">{entry.description || '–'}</TableCell>
                  <TableCell><span className="text-xs font-medium">{typeLabels[entry.type] || entry.type}</span></TableCell>
                  <TableCell className="text-sm text-right font-mono">{formatCHF(entry.amount)}</TableCell>
                  <TableCell><StatusBadge status={entry.status} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(entry)}>Bearbeiten</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? 'Buchung bearbeiten' : 'Neue Buchung'}</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const data = {
                entry_date: editing.entry_date || new Date().toISOString(),
                type: editing.type,
                amount: Number(editing.amount),
                description: editing.description || undefined,
                reference_number: editing.reference_number || undefined,
                category: editing.category || undefined,
                status: editing.status || 'pending',
              }
              if (editing.id) updateMutation.mutate({ id: editing.id, data })
              else createMutation.mutate(data)
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Typ</Label>
                  <Select value={editing.type || ''} onValueChange={v => setEditing(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status || 'pending'} onValueChange={v => setEditing(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Betrag (CHF)</Label>
                <Input type="number" step="0.01" value={editing.amount || ''} onChange={e => setEditing(p => ({ ...p, amount: e.target.value }))} required />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Input value={editing.description || ''} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Referenznummer</Label>
                  <Input value={editing.reference_number || ''} onChange={e => setEditing(p => ({ ...p, reference_number: e.target.value }))} />
                </div>
                <div>
                  <Label>Kategorie</Label>
                  <Input value={editing.category || ''} onChange={e => setEditing(p => ({ ...p, category: e.target.value }))} />
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
