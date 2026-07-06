import React from 'react'
import PageHeader from '../components/shared/PageHeader'
import TabGovernanceRules from '../components/admin/enterprise/TabGovernanceRules'

export default function GovernanceRules() {
  return (
    <div>
      <PageHeader title="Governance-Regeln" subtitle="Policy-as-Code Framework" />
      <TabGovernanceRules />
    </div>
  )
}
