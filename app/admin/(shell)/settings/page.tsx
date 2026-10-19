import AdminPlaceholder from '@/components/admin/AdminPlaceholder'
import { SettingsIcon } from '@/components/admin/icons'

export default function SettingsPage() {
  return (
    <AdminPlaceholder
      title="Settings & Configuration"
      description="Manage publication metadata, API integrations, Unsplash credentials, email templates, and environment settings."
      icon={<SettingsIcon size={24} />}
      futureSprint="Scheduled for Settings Sprint"
    />
  )
}
