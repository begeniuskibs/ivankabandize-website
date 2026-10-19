import AdminPlaceholder from '@/components/admin/AdminPlaceholder'
import { CommentsIcon } from '@/components/admin/icons'

export default function CommentsPage() {
  return (
    <AdminPlaceholder
      title="Comments Moderation"
      description="Moderate reader comments, threaded discussions, spam flags, and approvals across all garden posts."
      icon={<CommentsIcon size={24} />}
      futureSprint="Scheduled for Moderation Sprint"
    />
  )
}
