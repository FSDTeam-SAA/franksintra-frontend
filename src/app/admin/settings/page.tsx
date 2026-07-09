'use client'

import { AdminShell } from '@/components/admin/AdminShell'
import { AccountSettingsContent } from '@/components/account/AccountSettingsContent'

export default function AdminSettingsPage() {
  return (
    <AdminShell>
      <AccountSettingsContent showAppHeader={false} />
    </AdminShell>
  )
}
