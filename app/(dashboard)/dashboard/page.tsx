import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { DashboardStats } from './_components/DashboardStats'
import { AttendanceChart } from './_components/AttendanceChart'
import { FeeChart } from './_components/FeeChart'
import { RecentActivity } from './_components/RecentActivity'

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome back — here's what's happening today." />
      <div className="space-y-6">
        <DashboardStats />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <AttendanceChart />
          <FeeChart />
        </div>
        <RecentActivity />
      </div>
    </div>
  )
}
