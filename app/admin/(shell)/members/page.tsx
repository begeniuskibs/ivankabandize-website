import AdminPlaceholder from '@/components/admin/AdminPlaceholder'
import { MembersIcon } from '@/components/admin/icons'

export default function MembersPage() {
  return (
    <AdminPlaceholder
      title="Members & Subscribers"
      description="View registered readers, subscription tiers, access levels, and engagement history."
      icon={<MembersIcon size={24} />}
      futureSprint="Scheduled for Membership Sprint"
    />
  )
}
