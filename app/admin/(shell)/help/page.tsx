import AdminPlaceholder from '@/components/admin/AdminPlaceholder'
import { HelpIcon } from '@/components/admin/icons'

export default function HelpPage() {
  return (
    <AdminPlaceholder
      title="Help & Documentation"
      description="Guides, keyboard shortcuts, markdown formatting references, and publishing workflows."
      icon={<HelpIcon size={24} />}
      futureSprint="Scheduled for Documentation Sprint"
    />
  )
}
