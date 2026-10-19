import AdminPlaceholder from '@/components/admin/AdminPlaceholder'
import { AnalyticsIcon } from '@/components/admin/icons'

export default function AnalyticsPage() {
  return (
    <AdminPlaceholder
      title="Analytics"
      description="Aggregated readership, subscriber growth, and post performance metrics will be available here."
      icon={<AnalyticsIcon size={24} />}
      futureSprint="Scheduled for Analytics Sprint"
    />
  )
}
