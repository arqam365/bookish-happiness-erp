'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, CalendarCheck, CreditCard, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'
import api from '@/lib/api'

interface Stats {
  totalStudents: number
  attendanceToday: number
  feeCollectedToday: number
  pendingFees: number
}

async function fetchStats(): Promise<Stats> {
  const { data } = await api.get('/dashboard/stats')
  return data
}

const STAT_CONFIGS = [
  {
    key: 'totalStudents' as const,
    label: 'Total Students',
    icon: Users,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'attendanceToday' as const,
    label: 'Attendance Today',
    icon: CalendarCheck,
    format: (v: number) => `${v}%`,
  },
  {
    key: 'feeCollectedToday' as const,
    label: 'Collected Today',
    icon: CreditCard,
    format: formatCurrency,
  },
  {
    key: 'pendingFees' as const,
    label: 'Pending Fees',
    icon: AlertCircle,
    format: formatCurrency,
  },
]

export function DashboardStats() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: fetchStats })

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {STAT_CONFIGS.map(({ key, label, icon: Icon, format }) => (
        <Card key={key} className="p-5">
          <div className="flex items-center justify-between">
            <div className={cn('rounded-xl p-2.5 bg-gray-100 dark:bg-white/10')}>
              <Icon className="h-5 w-5 text-gray-600 dark:text-white" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <div className="h-7 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data ? format(data[key]) : '—'}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
