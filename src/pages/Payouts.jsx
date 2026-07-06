import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { avaai } from '@/api/avaaiClient'
import { Search, CheckCircle2, XCircle, Send } from 'lucide-react'
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

export default function Payouts() {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: () => avaai.entities.Payout.list('-created_at', 500),
  })

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => avaai.auth.me() })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => avaai.entities.Payout.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payouts'] }); setEditing(null); toast({ title: 'Gespeichert' }) },
  })

  const filtered = payouts.filter(p =>
    `${p.recipient_name || ''} ${p.reference || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const totalPending = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalApproved = payouts.filter(p => p.status === 'approved').reduce((s, p) => s + Number(p.amount || 0), 0)

  const formatCHF = (v) => `CHF ${(v || 0).toLocaleString('de-CH', { minimumFractionDigits: 2 })}`

  const handleStatusChange = (id, status) => {
    updateMutation.mutate({ id, data: { status, approved_by: status === 'approved' ? me?.id : undefined, approved_at: status === 'approved' ? new Date().toISOString() : undefined } })
  }

  return (
    <div>
      <PageHeader title="Auszahlungen" subtitle={`${payouts.length} Auszahlungen`} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Ausstehend</span>
          <span className="text-lg font-bold text-amber-600">{formatCHF(totalPending)}</span>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Genehmigt</span>
          <span className="text-lg font-bold text-blue-600">{formatCHF(totalApproved)}</span>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Anzahl offen</span>
          <span className="text-lg font-bold">{payouts.filter(p => p.status === 'pending').length}</span>
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
                <TableHead>Empfänger</TableHead>
                <TableHead>Referenz</TableHead>
                <TableHead>Fällig am</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Keine Auszahlungen</TableCell></TableRow>
              ) : filtered.map(payout => (
                <TableRow key={payout.id}>
                  <TableCell className="text-sm font-medium">{payout.recipient_name || '–'}</TableCell>
                  <TableCell className="text-sm font-mono">{payout.reference || '–'}</TableCell>
                  <TableCell className="text-sm">{payout.due_date ? format(new Date(payout.due_date), 'dd.MM.yyyy') : '–'}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{formatCHF(payout.amount)}</TableCell>
                  <TableCell><StatusBadge status={payout.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {payout.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleStatusChange(payout.id, 'approved')} title="Genehmigen"><CheckCircle2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleStatusChange(payout.id, 'rejected')} title="Ablehnen"><XCircle className="w-4 h-4" /></Button>
                        </>
                      )}
                      {payout.status === 'approved' && (
                        <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => handleStatusChange(payout.id, 'paid')} title="Als bezahlt markieren"><Send className="w-4 h-4" /></Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setEditing(payout)}>Details</Button>
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
          <DialogHeader><DialogTitle>Auszahlungsdetails</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={(e) => {
              e.preventDefault()
              updateMutation.mutate({ id: editing.id, data: { notes: editing.notes, reference: editing.reference } })
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Empfänger:</span> <span className="font-medium">{editing.recipient_name}</span></div>
                <div><span className="text-muted-foreground">Betrag:</span> <span className="font-medium">{formatCHF(editing.amount)}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={editing.status} /></div>
                <div><span className="text-muted-foreground">Fällig:</span> <span>{editing.due_date ? format(new Date(editing.due_date), 'dd.MM.yyyy') : '–'}</span></div>
              </div>
              <div>
                <Label>Referenz</Label>
                <Input value={editing.reference || ''} onChange={e => setEditing(p => ({ ...p, reference: e.target.value }))} />
              </div>
              <div>
                <Label>Notizen</Label>
                <Textarea value={editing.notes || ''} onChange={e => setEditing(p => ({ ...p, notes: e.target.value }))} rows={3} />
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
