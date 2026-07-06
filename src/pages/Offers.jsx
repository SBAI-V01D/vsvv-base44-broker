import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { avaai } from '@/api/avaaiClient'
import { Plus, Search, Send, CheckCircle2, XCircle } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'

const statusLabels = {
  preparing: 'In Vorbereitung',
  ready: 'Bereit',
  sent: 'Gesendet',
  accepted: 'Angenommen',
  rejected: 'Abgelehnt',
  expired: 'Abgelaufen',
}

export default function Offers() {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['offers'],
    queryFn: () => avaai.entities.Offerte.list('-created_at', 500),
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers_offers'],
    queryFn: () => avaai.entities.Customer.list(null, 500),
  })

  const createMutation = useMutation({
    mutationFn: (data) => avaai.entities.Offerte.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['offers'] }); setEditing(null); toast({ title: 'Angebot erstellt' }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => avaai.entities.Offerte.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['offers'] }); setEditing(null); toast({ title: 'Gespeichert' }) },
  })

  const filtered = offers.filter(o =>
    `${o.title || ''} ${o.customer_name || ''} ${o.offer_number || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const counts = offers.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {})

  return (
    <div>
      <PageHeader title="Angebote" subtitle={`${offers.length} Angebote`}>
        <Button onClick={() => setEditing({})}><Plus className="w-4 h-4 mr-1" /> Neues Angebot</Button>
      </PageHeader>

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
                <TableHead>Angebot</TableHead>
                <TableHead>Kunde</TableHead>
                <TableHead>Betrag</TableHead>
                <TableHead>Erstellt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Keine Angebote</TableCell></TableRow>
              ) : filtered.map(offer => (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium text-sm">{offer.title || offer.offer_number || '–'}</TableCell>
                  <TableCell className="text-sm">{offer.customer_name || '–'}</TableCell>
                  <TableCell className="text-sm font-mono">
                    {offer.premium_amount ? `CHF ${Number(offer.premium_amount).toLocaleString('de-CH', { minimumFractionDigits: 2 })}` : '–'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {offer.created_at ? format(new Date(offer.created_at), 'dd.MM.yyyy') : '–'}
                  </TableCell>
                  <TableCell><StatusBadge status={offer.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {offer.status === 'ready' && (
                        <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => updateMutation.mutate({ id: offer.id, data: { status: 'sent' } })} title="Als gesendet markieren"><Send className="w-4 h-4" /></Button>
                      )}
                      {offer.status === 'sent' && (
                        <>
                          <Button variant="ghost" size="sm" className="text-green-600" onClick={() => updateMutation.mutate({ id: offer.id, data: { status: 'accepted' } })} title="Angenommen"><CheckCircle2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => updateMutation.mutate({ id: offer.id, data: { status: 'rejected' } })} title="Abgelehnt"><XCircle className="w-4 h-4" /></Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setEditing(offer)}>Bearbeiten</Button>
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
          <DialogHeader><DialogTitle>{editing?.id ? 'Angebot bearbeiten' : 'Neues Angebot'}</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const data = {
                title: editing.title || 'Angebot',
                customer_id: editing.customer_id || undefined,
                customer_name: customers.find(c => c.id === editing.customer_id) ? `${customers.find(c => c.id === editing.customer_id).first_name} ${customers.find(c => c.id === editing.customer_id).last_name}` : editing.customer_name,
                offer_number: editing.offer_number || undefined,
                premium_amount: editing.premium_amount ? Number(editing.premium_amount) : undefined,
                status: editing.status || 'preparing',
                notes: editing.notes || undefined,
              }
              if (editing.id) updateMutation.mutate({ id: editing.id, data })
              else createMutation.mutate(data)
            }} className="space-y-4">
              <div>
                <Label>Titel *</Label>
                <Input value={editing.title || ''} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div>
                <Label>Kunde</Label>
                <Select value={editing.customer_id || ''} onValueChange={v => setEditing(p => ({ ...p, customer_id: v, customer_name: customers.find(c => c.id === v) ? `${customers.find(c => c.id === v).first_name} ${customers.find(c => c.id === v).last_name}` : '' }))}>
                  <SelectTrigger><SelectValue placeholder="Kunde wählen" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Angebotsnummer</Label>
                  <Input value={editing.offer_number || ''} onChange={e => setEditing(p => ({ ...p, offer_number: e.target.value }))} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status || 'preparing'} onValueChange={v => setEditing(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Prämienbetrag (CHF)</Label>
                <Input type="number" step="0.01" value={editing.premium_amount || ''} onChange={e => setEditing(p => ({ ...p, premium_amount: e.target.value }))} />
              </div>
              <div>
                <Label>Notizen</Label>
                <Textarea value={editing.notes || ''} onChange={e => setEditing(p => ({ ...p, notes: e.target.value }))} rows={3} />
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
