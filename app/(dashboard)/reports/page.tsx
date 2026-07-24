'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, UserCheck, AlertTriangle, Download, Receipt, FileText } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

function fmt(n: number) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n)
}

async function downloadExport(url: string, filename: string) {
  const res = await api.get(url, { responseType: 'blob' })
  const href = URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
  URL.revokeObjectURL(href)
}

// ─── Student Strength ─────────────────────────────────────────────────────────
interface StrengthData { total: number; byClass: Array<{ className: string; count: number }> }

function StudentStrengthReport() {
  const { data, isLoading } = useQuery<StrengthData>({
    queryKey: ['report-strength'],
    queryFn: () => api.get('/reports/student-strength').then((r) => r.data),
  })

  if (isLoading) return <ReportSkeleton />
  if (!data) return <EmptyReport />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => downloadExport('/export/students', 'students.xlsx')}>
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total students</p>
        <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{data.total}</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Class</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500">Students</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {data.byClass.map((row) => (
              <tr key={row.className} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <td className="px-5 py-3 text-gray-900 dark:text-white">{row.className}</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Attendance Analytics ──────────────────────────────────────────────────────
interface AttendanceAnalytics { date: string; present: number; absent: number; late: number; rate: number }

function AttendanceReport() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))

  const { data: summary = [], isLoading } = useQuery<AttendanceAnalytics[]>({
    queryKey: ['report-attendance', date],
    queryFn: () => api.get('/reports/attendance-analytics', { params: { date } }).then((r) => r.data),
  })

  const { data: absentees = [] } = useQuery<Array<{ student: { firstName: string; lastName: string; admissionNo: string; phone: string | null } }>>({
    queryKey: ['attendance-absentees', date],
    queryFn: () => api.get('/attendance/absentees', { params: { date } }).then((r) => r.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Date</label>
          <input
            type="date"
            value={date}
            max={dayjs().format('YYYY-MM-DD')}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => downloadExport(`/export/attendance?date=${date}`, `attendance-${date}.xlsx`)}>
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {isLoading ? <ReportSkeleton /> : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          {absentees.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">No absentees on this date.</p>
          ) : (
            <>
              <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Absentees — {dayjs(date).format('D MMMM YYYY')}</p>
                <p className="text-xs text-gray-400">{absentees.length} absent</p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {absentees.map(({ student }, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-gray-400">{student.admissionNo}</p>
                    </div>
                    {student.phone && <p className="text-xs text-gray-500">{student.phone}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Fee Defaulters ────────────────────────────────────────────────────────────
interface Defaulter {
  id: string
  totalAmount: number
  dueDate: string | null
  status: string
  student: { firstName: string; lastName: string; admissionNo: string; phone: string | null }
  feeStructure: { name: string } | null
}

function FeeDefaultersReport() {
  const { data: defaulters = [], isLoading } = useQuery<Defaulter[]>({
    queryKey: ['fees-defaulters'],
    queryFn: () => api.get('/fees/defaulters').then((r) => r.data),
  })

  const totalPending = defaulters.reduce((s, d) => s + d.totalAmount, 0)

  if (isLoading) return <ReportSkeleton />

  return (
    <div className="space-y-4">
      {defaulters.length > 0 && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 dark:border-rose-900/30 dark:bg-rose-900/10">
          <p className="text-xs font-semibold uppercase text-rose-500">Total outstanding</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{fmt(totalPending)}</p>
          <p className="text-xs text-rose-400">{defaulters.length} pending payments</p>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {defaulters.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No defaulters found.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {defaulters.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{d.student.firstName} {d.student.lastName}</p>
                  <p className="text-xs text-gray-400">{d.student.admissionNo}{d.student.phone ? ` · ${d.student.phone}` : ''}</p>
                  {d.feeStructure && <p className="text-xs text-gray-400">{d.feeStructure.name}</p>}
                </div>
                <div className="flex items-center gap-3 text-right">
                  {d.dueDate && <p className="text-xs text-gray-400">Due: {dayjs(d.dueDate).format('D MMM YYYY')}</p>}
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(d.totalAmount)}</p>
                  <Badge variant={d.status === 'OVERDUE' ? 'danger' : 'warning'}>{d.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Fee Payments Export ──────────────────────────────────────────────────────
function FeePaymentsReport() {
  const [loading, setLoading] = useState(false)
  const handleExport = async () => {
    setLoading(true)
    try { await downloadExport('/export/fees', 'fee-payments.xlsx') } finally { setLoading(false) }
  }
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <Receipt className="h-10 w-10 text-gray-300 dark:text-gray-600" />
      <p className="text-sm text-gray-500">Export all collected fee payments to Excel</p>
      <Button variant="outline" size="sm" loading={loading} onClick={handleExport}>
        <Download className="h-4 w-4" />Download Excel
      </Button>
    </div>
  )
}

// ─── Vouchers Export ──────────────────────────────────────────────────────────
function VouchersReport() {
  const [loading, setLoading] = useState(false)
  const handleExport = async () => {
    setLoading(true)
    try { await downloadExport('/export/vouchers', 'vouchers.xlsx') } finally { setLoading(false) }
  }
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600" />
      <p className="text-sm text-gray-500">Export all vouchers to Excel</p>
      <Button variant="outline" size="sm" loading={loading} onClick={handleExport}>
        <Download className="h-4 w-4" />Download Excel
      </Button>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ReportSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
  )
}

function EmptyReport() {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <p className="text-sm text-gray-400">No data available.</p>
    </div>
  )
}

// ─── Report cards ─────────────────────────────────────────────────────────────
const REPORTS = [
  { id: 'strength', label: 'Student Strength', icon: Users, description: 'Total enrolment by class' },
  { id: 'attendance', label: 'Attendance', icon: UserCheck, description: 'Daily absentees & summary' },
  { id: 'defaulters', label: 'Fee Defaulters', icon: AlertTriangle, description: 'Pending & overdue payments' },
  { id: 'fee-payments', label: 'Fee Payments', icon: Receipt, description: 'Export all collected payments' },
  { id: 'vouchers', label: 'Vouchers', icon: FileText, description: 'Export all accounting vouchers' },
]

export default function ReportsPage() {
  const [active, setActive] = useState<string | null>(null)

  if (active) {
    const report = REPORTS.find((r) => r.id === active)!
    return (
      <div>
        <PageHeader
          title={report.label}
          subtitle={report.description}
          action={
            <button onClick={() => setActive(null)} className="text-sm text-[#4F46E5] hover:underline">
              ← All reports
            </button>
          }
        />
        {active === 'strength' && <StudentStrengthReport />}
        {active === 'attendance' && <AttendanceReport />}
        {active === 'defaulters' && <FeeDefaultersReport />}
        {active === 'fee-payments' && <FeePaymentsReport />}
        {active === 'vouchers' && <VouchersReport />}
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Insights and analytics for your institute." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            onClick={() => setActive(r.id)}
            className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
              <r.icon className="h-5 w-5 text-[#4F46E5]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.label}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{r.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
