import React, { useState } from 'react';
import { Upload, Download, ArrowRightLeft, CheckCircle, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { KpiCard } from '@/components/shared';

const MIGRATION_TYPES = [
  { key: 'crm', label: 'CRM System', description: 'Bestandskunden und Datensätze importieren', icon: ArrowRightLeft },
  { key: 'documents', label: 'Dokumente', description: 'Sichtbare PDFs, Scans und Bilder migrieren', icon: Upload },
  { key: 'contracts', label: 'Verträge', description: 'Bestandsverträge und Laufzeiten überspielen', icon: ArrowRightLeft },
  { key: 'tasks', label: 'Aufgaben', description: 'Offene und abgeschlossene Tasks migrieren', icon: ArrowRightLeft },
];

export default function Migration() {
  const [migrationType, setMigrationType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const startMigration = () => {
    setIsRunning(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="page-enter flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[hsl(var(--primary))] tracking-tight">Migration & Import</h1>
              <p className="text-xs text-muted-foreground">Datensätze von externen Systemen in die VSVV Platform bringen</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Migration Types */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Migrationsmodul wählen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MIGRATION_TYPES.map((type) => (
              <button
                key={type.key}
                type="button"
                onClick={() => setMigrationType(type.key)}
                className={`flex flex-col items-start gap-3 p-5 rounded-xl border-2 transition-all hover:shadow-md text-left ${migrationType === type.key ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:border-primary/40'}`}
              >
                <type.icon className={`w-6 h-6 ${migrationType === type.key ? 'text-primary' : 'text-muted-foreground'}`}>
                </type.icon>
                <div>
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Upload & Run */}
        {migrationType && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm">Datei auswählen & starten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label className="text-xs font-medium text-muted-foreground">CSV / Excel Datei</Label>
                  <Input
                    type="file"
                    className="mt-1 h-9"
                    onChange={e => setSelectedFile(e.target.files?.[0]?.name || null)}
                  />
                  {selectedFile && <p className="text-xs text-primary mt-1">✓ {selectedFile}</p>}
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2 h-9">
                      <Settings className="w-3.5 h-3.5" /> Einstellungen
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Migrations-Einstellungen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                      <div className="flex items-center gap-2">
                        <Input type="checkbox" id="dry-run" className="h-4 w-4" />
                        <Label htmlFor="dry-run" className="text-sm">Dry Run – Ohne Schreiben</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input type="checkbox" id="validate" className="h-4 w-4" defaultChecked />
                        <Label htmlFor="validate" className="text-sm">Validierung vor Export</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button size="sm" variant="outline">Schließen</Button>
                      <Button size="sm">Speichern</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Progress Bar */}
              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Migration läuft…</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {progress === 100 && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Migration erfolgreich abgeschlossen!</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className="gap-2"
                  onClick={startMigration}
                  disabled={isRunning || !selectedFile}
                >
                  {isRunning ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Laufen…</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Migration starten</>
                  )}
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-3.5 h-3.5" /> Vorlage herunterladen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Log Output */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm">Migrations-Protokoll</CardTitle>
            <CardDescription>Zuletzt ausgeführte Migrationen und Ergebnisse</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="text-muted-foreground/60">Noch keine Migrationen ausgeführt.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
