'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import api from '@/lib/api'

interface RecentStudent {
  id: string
  name: string
  class: string
  admittedAt: string
}

interface RecentPayment {
  id: string
  studentName: string
  amount: number
  paidAt: string
}

async function fetchActivity() {
  const { data } = await api.get('/dashboard/activity')
  return data as { recentStudents: RecentStudent[]; recentPayments: RecentPayment[] }
}

export function RecentActivity() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: fetchActivity,
  })

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Recent Admissions</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-gray-50 dark:bg-gray-800" />
            ))}
          </div>
        ) : !data?.recentStudents?.length ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No recent admissions</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.recentStudents.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{s.class}</p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(s.admittedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-gray-50 dark:bg-gray-800" />
            ))}
          </div>
        ) : !data?.recentPayments?.length ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No recent payments</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{p.studentName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(p.paidAt)}</p>
                </div>
                <Badge variant="success">{formatCurrency(p.amount)}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
