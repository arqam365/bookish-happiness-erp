'use client'

import { useQuery } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import api from '@/lib/api'

interface AttendancePoint {
  date: string
  percentage: number
}

async function fetchAttendanceTrend(): Promise<AttendancePoint[]> {
  const { data } = await api.get('/dashboard/attendance-trend')
  return data
}

export function AttendanceChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-attendance-trend'],
    queryFn: fetchAttendanceTrend,
  })
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const dark = mounted && resolvedTheme === 'dark'
  const gridColor = dark ? '#374151' : '#f0f0f0'
  const tickColor = dark ? '#9ca3af' : '#6b7280'
  const tooltipStyle = dark
    ? { fontSize: 12, borderRadius: 8, border: '1px solid #374151', backgroundColor: '#1f2937', color: '#f9fafb' }
    : { fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Trend (Last 30 Days)</CardTitle>
      </CardHeader>
      {isLoading ? (
        <div className="h-56 animate-pulse rounded-lg bg-gray-50 dark:bg-gray-800" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Attendance']} />
            <Line
              type="monotone"
              dataKey="percentage"
              stroke={dark ? '#ffffff' : '#4F46E5'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
