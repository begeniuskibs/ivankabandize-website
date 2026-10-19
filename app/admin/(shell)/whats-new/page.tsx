import AdminPlaceholder from '@/components/admin/AdminPlaceholder'
import { WhatsNewIcon } from '@/components/admin/icons'

export default function WhatsNewPage() {
  return (
    <AdminPlaceholder
      title="What's New"
      description="Release notes, changelog updates, and new publishing capabilities will appear here."
      icon={<WhatsNewIcon size={24} />}
      futureSprint="Scheduled for Updates & Changelog Sprint"
    />
  )
}
