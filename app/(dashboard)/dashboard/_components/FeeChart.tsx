'use client'

import { useQuery } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'

interface FeePoint {
  month: string
  amount: number
}

async function fetchFeeCollection(): Promise<FeePoint[]> {
  const { data } = await api.get('/dashboard/fee-collection')
  return data
}

export function FeeChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-fee-collection'],
    queryFn: fetchFeeCollection,
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
        <CardTitle>Fee Collection (Last 6 Months)</CardTitle>
      </CardHeader>
      {isLoading ? (
        <div className="h-56 animate-pulse rounded-lg bg-gray-50 dark:bg-gray-800" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(Number(v)), 'Collected']} />
            <Bar dataKey="amount" fill={dark ? '#ffffff' : '#10B981'} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
