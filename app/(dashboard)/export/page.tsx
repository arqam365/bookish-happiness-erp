'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'

type ExportFormat = 'excel' | 'csv' | 'pdf'

interface ExportCard {
  id: string
  title: string
  description: string
  formats: ExportFormat[]
  hasDateRange?: boolean
  filters?: { key: string; label: string; endpoint: string }[]
}

const EXPORT_CARDS: ExportCard[] = [
  {
    id: 'students',
    title: 'Students',
    description: 'Full student list with personal info and enrollment details.',
    formats: ['excel', 'csv'],
    filters: [{ key: 'status', label: 'Status', endpoint: '' }],
  },
  {
    id: 'attendance-summary',
    title: 'Attendance Summary',
    description: 'Aggregated attendance per student for a date range.',
    formats: ['excel', 'csv'],
    hasDateRange: true,
  },
  {
    id: 'attendance-detailed',
    title: 'Attendance Detailed',
    description: 'Day-by-day attendance for each student.',
    formats: ['excel', 'csv'],
    hasDateRange: true,
  },
  {
    id: 'fee-defaulters',
    title: 'Fee Defaulters',
    description: 'Students with outstanding dues, grouped by aging.',
    formats: ['excel', 'csv'],
  },
  {
    id: 'fee-collection',
    title: 'Fee Collection',
    description: 'All receipts within a date range.',
    formats: ['excel', 'csv'],
    hasDateRange: true,
  },
  {
    id: 'guardians',
    title: 'Guardians',
    description: 'Complete guardians list with contact and address info.',
    formats: ['excel', 'csv'],
  },
  {
    id: 'enrollments',
    title: 'Enrollments',
    description: 'Student enrollments per class and academic year.',
    formats: ['excel', 'csv'],
  },
  {
    id: 'receipts',
    title: 'Receipts',
    description: 'All payment receipts with full details.',
    formats: ['excel', 'csv'],
    hasDateRange: true,
  },
  {
    id: 'vouchers',
    title: 'Vouchers',
    description: 'Accounting voucher entries.',
    formats: ['excel', 'csv'],
    hasDateRange: true,
  },
  {
    id: 'id-cards',
    title: 'ID Cards',
    description: 'Student ID card sheets for printing.',
    formats: ['pdf'],
    filters: [{ key: 'classId', label: 'Class', endpoint: '/settings/classes' }],
  },
  {
    id: 'report-cards',
    title: 'Report Cards',
    description: 'Bulk report cards for an exam.',
    formats: ['pdf'],
    filters: [{ key: 'examId', label: 'Exam', endpoint: '/exams' }],
  },
]

function formatIcon(f: ExportFormat) {
  if (f === 'pdf') return <FileText className="h-3.5 w-3.5" />
  return <FileSpreadsheet className="h-3.5 w-3.5" />
}

function formatLabel(f: ExportFormat) {
  return f.toUpperCase()
}

function ExportModal({ card, onClose }: { card: ExportCard; onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [format, setFormat] = useState<ExportFormat>(card.formats[0])
  const [from, setFrom] = useState(firstOfMonth)
  const [to, setTo] = useState(today)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)

  async function handleExport() {
    setLoading(true)
    setProgress(0)
    try {
      const params: Record<string, string> = { format, ...filterValues }
      if (card.hasDateRange) { params.from = from; params.to = to }

      const res = await api.get(`/export/${card.id}`, { params, responseType: 'blob' })

      const ext = format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv'
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${card.id}-export.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      onClose()
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{card.description}</p>
      </div>

      {card.formats.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Format</label>
          <div className="flex gap-2">
            {card.formats.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  format === f
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                }`}
              >
                {formatIcon(f)}
                {formatLabel(f)}
              </button>
            ))}
          </div>
        </div>
      )}

      {card.hasDateRange && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
        </div>
      )}

      {card.filters?.map((filter) => (
        <FilterSelect
          key={filter.key}
          label={filter.label}
          endpoint={filter.endpoint}
          value={filterValues[filter.key] ?? ''}
          onChange={(v) => setFilterValues((prev) => ({ ...prev, [filter.key]: v }))}
        />
      ))}

      {progress !== null && (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-400">Preparing export…</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" loading={loading} onClick={handleExport}>
          <Download className="h-4 w-4" />Download
        </Button>
      </div>
    </div>
  )
}

function FilterSelect({ label, endpoint, value, onChange }: {
  label: string; endpoint: string; value: string; onChange: (v: string) => void
}) {
  const { data: options = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['export-filter', endpoint],
    queryFn: () => endpoint ? api.get(endpoint).then((r) => r.data) : Promise.resolve([]),
    enabled: !!endpoint,
  })

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      >
        <option value="">All</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  )
}

export default function ExportPage() {
  const [activeCard, setActiveCard] = useState<ExportCard | null>(null)

  return (
    <div>
      <PageHeader title="Export" subtitle="Download your data in Excel, CSV, or PDF format." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORT_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={() => setActiveCard(card)}
            className="group flex flex-col items-start gap-3 rounded-xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-indigo-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{card.title}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{card.description}</p>
            </div>
            <div className="flex gap-1.5">
              {card.formats.map((f) => (
                <Badge key={f} variant="default">{formatLabel(f)}</Badge>
              ))}
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!activeCard} onOpenChange={(v) => !v && setActiveCard(null)}>
        <DialogContent
          title={activeCard ? `Export: ${activeCard.title}` : ''}
          description={activeCard?.description ?? ''}
        >
          {activeCard && <ExportModal card={activeCard} onClose={() => setActiveCard(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
