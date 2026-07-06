import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { avaai } from '@/api/avaaiClient'
import { Plus, Search, Mail, Phone, Building2 } from 'lucide-react'
import PageHeader from '../components/shared/PageHeader'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function Advisors() {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: advisors = [], isLoading } = useQuery({
    queryKey: ['advisors'],
    queryFn: () => avaai.entities.Advisor.list('-created_at', 500),
  })

  const createMutation = useMutation({
    mutationFn: (data) => avaai.entities.Advisor.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advisors'] }); setEditing(null); toast({ title: 'Berater erstellt' }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => avaai.entities.Advisor.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advisors'] }); setEditing(null); toast({ title: 'Gespeichert' }) },
  })

  const filtered = advisors.filter(a =>
    `${a.firstname || ''} ${a.lastname || ''} ${a.email || ''} ${a.organization || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader title="Berater & Broker" subtitle={`${advisors.length} Berater`}>
        <Button onClick={() => setEditing({})}><Plus className="w-4 h-4 mr-1" /> Neuer Berater</Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Berater</p><p className="text-2xl font-bold">{advisors.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Aktiv</p><p className="text-2xl font-bold text-green-600">{advisors.filter(a => a.active !== false).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Inaktiv</p><p className="text-2xl font-bold text-red-600">{advisors.filter(a => a.active === false).length}</p></CardContent></Card>
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
                <TableHead>E-Mail</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Keine Berater</TableCell></TableRow>
              ) : filtered.map(advisor => (
                <TableRow key={advisor.id}>
                  <TableCell className="font-medium">{advisor.firstname} {advisor.lastname}</TableCell>
                  <TableCell>
                    <a href={`mailto:${advisor.email}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                      <Mail className="w-3 h-3" /> {advisor.email}
                    </a>
                  </TableCell>
                  <TableCell className="text-sm">
                    {advisor.phone && <a href={`tel:${advisor.phone}`} className="flex items-center gap-1"><Phone className="w-3 h-3" /> {advisor.phone}</a>}
                  </TableCell>
                  <TableCell className="text-sm flex items-center gap-1"><Building2 className="w-3 h-3 text-muted-foreground" /> {advisor.organization || '–'}</TableCell>
                  <TableCell><span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">{advisor.role || 'advisor'}</span></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(advisor)}>Bearbeiten</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? 'Berater bearbeiten' : 'Neuer Berater'}</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const data = {
                firstname: editing.firstname,
                lastname: editing.lastname,
                email: editing.email,
                phone: editing.phone || undefined,
                organization: editing.organization || undefined,
                role: editing.role || 'advisor',
                active: editing.active !== false,
              }
              if (editing.id) updateMutation.mutate({ id: editing.id, data })
              else createMutation.mutate(data)
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vorname *</Label>
                  <Input value={editing.firstname || ''} onChange={e => setEditing(p => ({ ...p, firstname: e.target.value }))} required />
                </div>
                <div>
                  <Label>Nachname *</Label>
                  <Input value={editing.lastname || ''} onChange={e => setEditing(p => ({ ...p, lastname: e.target.value }))} required />
                </div>
              </div>
              <div>
                <Label>E-Mail *</Label>
                <Input type="email" value={editing.email || ''} onChange={e => setEditing(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={editing.phone || ''} onChange={e => setEditing(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Organisation</Label>
                <Input value={editing.organization || ''} onChange={e => setEditing(p => ({ ...p, organization: e.target.value }))} />
              </div>
              <div>
                <Label>Rolle</Label>
                <Select value={editing.role || 'advisor'} onValueChange={v => setEditing(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advisor">Berater</SelectItem>
                    <SelectItem value="broker">Broker</SelectItem>
                    <SelectItem value="senior_advisor">Senior Berater</SelectItem>
                    <SelectItem value="teamlead">Teamlead</SelectItem>
                  </SelectContent>
                </Select>
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
