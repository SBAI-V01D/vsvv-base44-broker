/**
 * AdminSecurity — Sicherheit & Governance
 *
 * Bündelt Security-Analytics, Compliance, Governance Rules und Incidents
 * aus den bestehenden Enterprise-Tab-Komponenten in einer Page.
 */
import React from 'react'
import { Shield, ShieldAlert } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TabSecurity from '@/components/admin/enterprise/TabSecurity'
import TabCompliance from '@/components/admin/enterprise/TabCompliance'
import TabGovernanceRules from '@/components/admin/enterprise/TabGovernanceRules'
import TabIncidents from '@/components/admin/enterprise/TabIncidents'

export default function AdminSecurity() {
  return (
    <div className="page-enter flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-orange-600 flex items-center justify-center shadow-md shadow-rose-200/50">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Sicherheit & Governance</h1>
            <p className="text-xs text-muted-foreground">Security Analytics · Compliance · Governance Rules · Incidents</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="security" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Compliance</span>
            </TabsTrigger>
            <TabsTrigger value="governance" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Governance Rules</span>
            </TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Incidents</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security">
            <TabSecurity />
          </TabsContent>
          <TabsContent value="compliance">
            <TabCompliance />
          </TabsContent>
          <TabsContent value="governance">
            <TabGovernanceRules />
          </TabsContent>
          <TabsContent value="incidents">
            <TabIncidents />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


