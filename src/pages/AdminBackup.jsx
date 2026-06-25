/**
 * AdminBackup — Backup & Recovery
 *
 * Bündelt BackupManager und EnterpriseBackupManager in einer Page.
 */
import React from 'react'
import { HardDrive } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BackupManager from '@/components/admin/BackupManager'
import EnterpriseBackupManager from '@/components/admin/EnterpriseBackupManager'

export default function AdminBackup() {
  return (
    <div className="page-enter flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200/50">
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Backup & Recovery</h1>
            <p className="text-xs text-muted-foreground">Backup-Manager · Enterprise Backup · Wiederherstellung</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="backup" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              <span className="hidden sm:inline">Backup Manager</span>
            </TabsTrigger>
            <TabsTrigger value="enterprise" className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              <span className="hidden sm:inline">Enterprise Backup</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="backup">
            <BackupManager />
          </TabsContent>
          <TabsContent value="enterprise">
            <EnterpriseBackupManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
