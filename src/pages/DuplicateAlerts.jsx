import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { avaai } from '@/api/avaaiClient'
import { Search, CheckCircle2, AlertTriangle } from 'lucide-react'
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
  open: 'Offen',
  investigating: 'In Prüfung',
  resolved: 'Gelöst',
  ignored: 'Ignoriert',
}

export default function DuplicateAlerts() {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['duplicate_alerts'],
    queryFn: () => avaai.entities.DuplicateAlert.list('-created_at', 500),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => avaai.entities.DuplicateAlert.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['duplicate_alerts'] }); setEditing(null); toast({ title: 'Gespeichert' }) },
  })

  const filtered = alerts.filter(a =>
    `${a.entity_type || ''} ${a.field_name || ''} ${a.value || ''} ${a.status || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const openAlerts = alerts.filter(a => a.status === 'open' || a.status === 'investigating')

  return (
    <div>
      <PageHeader title="Dubletten" subtitle={`${alerts.length} Alerts, ${openAlerts.length} offen`}>
        <Button variant="outline" className="text-amber-600" onClick={() => updateMutation.mutate({ id: '*', data: { status: 'investigating' } })}>
          <AlertTriangle className="w-4 h-4 mr-1" /> Alle prüfen
        </Button>
      </PageHeader>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(statusLabels).map(([status, label]) => (
          <Card key={status}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{alerts.filter(a => a.status === status).length}</p>
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
                <TableHead>Entität</TableHead>
                <TableHead>Feld</TableHead>
                <TableHead>Wert</TableHead>
                <TableHead>Duplikate</TableHead>
                <TableHead>Erkannt am</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Keine Dubletten</TableCell></TableRow>
              ) : filtered.map(alert => (
                <TableRow key={alert.id}>
                  <TableCell className="text-sm font-medium">{alert.entity_type || '–'}</TableCell>
                  <TableCell className="text-sm font-mono">{alert.field_name || '–'}</TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{alert.value || '–'}</TableCell>
                  <TableCell className="text-sm">{alert.duplicate_count || alert.duplicate_ids?.length || '–'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{alert.created_at ? format(new Date(alert.created_at), 'dd.MM.yyyy') : '–'}</TableCell>
                  <TableCell><StatusBadge status={alert.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {alert.status === 'open' && (
                        <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => updateMutation.mutate({ id: alert.id, data: { status: 'investigating' } })} title="Prüfen"><Search className="w-4 h-4" /></Button>
                      )}
                      {(alert.status === 'open' || alert.status === 'investigating') && (
                        <>
                          <Button variant="ghost" size="sm" className="text-green-600" onClick={() => updateMutation.mutate({ id: alert.id, data: { status: 'resolved' } })} title="Als gelöst markieren"><CheckCircle2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-slate-400" onClick={() => updateMutation.mutate({ id: alert.id, data: { status: 'ignored' } })} title="Ignorieren">x</Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setEditing(alert)}>Details</Button>
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
          <DialogHeader><DialogTitle>Dubletten-Details</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Entität:</span> <span className="font-medium">{editing.entity_type}</span></div>
                <div><span className="text-muted-foreground">Feld:</span> <span className="font-mono">{editing.field_name}</span></div>
                <div><span className="text-muted-foreground">Wert:</span> <span className="font-medium">{editing.value}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={editing.status} /></div>
              </div>
              {editing.duplicate_ids?.length > 0 && (
                <div className="text-sm p-3 bg-slate-50 rounded-lg">
                  <p className="text-muted-foreground mb-1">Duplikat-IDs:</p>
                  <div className="font-mono text-xs space-y-0.5">{editing.duplicate_ids.map((id, i) => <div key={i}>{id}</div>)}</div>
                </div>
              )}
              {editing.resolution_notes && (
                <div className="text-sm p-3 bg-green-50 rounded-lg">
                  <span className="text-muted-foreground">Lösungsnotiz:</span> {editing.resolution_notes}
                </div>
              )}
              <div>
                <Label>Notiz hinzufügen</Label>
                <Textarea value={editing.resolution_notes || ''} onChange={e => setEditing(p => ({ ...p, resolution_notes: e.target.value }))} rows={3} placeholder="Lösung oder Kommentar..." />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Schliessen</Button>
                <Button onClick={() => { updateMutation.mutate({ id: editing.id, data: { resolution_notes: editing.resolution_notes } }); setEditing(null) }} disabled={updateMutation.isPending}>Speichern</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
