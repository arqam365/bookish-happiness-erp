'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Trash2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'

interface DeleteEntity {
  id: string
  title: string
  description: string
  confirmText: string
  endpoint: string
  filters?: { key: string; label: string; type: 'date' | 'text' }[]
  danger: 'high' | 'critical'
}

const ENTITIES: DeleteEntity[] = [
  {
    id: 'attendance',
    title: 'Attendance Records',
    description: 'Delete attendance records within a specific date range. This cannot be undone.',
    confirmText: 'DELETE ATTENDANCE',
    endpoint: '/delete-data/attendance',
    filters: [
      { key: 'from', label: 'From date', type: 'date' },
      { key: 'to', label: 'To date', type: 'date' },
    ],
    danger: 'high',
  },
  {
    id: 'receipts',
    title: 'Fee Receipts',
    description: 'Delete receipts and create corresponding reversal entries. Requires admin permission.',
    confirmText: 'DELETE RECEIPTS',
    endpoint: '/delete-data/receipts',
    filters: [
      { key: 'from', label: 'From date', type: 'date' },
      { key: 'to', label: 'To date', type: 'date' },
    ],
    danger: 'critical',
  },
  {
    id: 'vouchers',
    title: 'Vouchers',
    description: 'Delete accounting voucher entries within a date range.',
    confirmText: 'DELETE VOUCHERS',
    endpoint: '/delete-data/vouchers',
    filters: [
      { key: 'from', label: 'From date', type: 'date' },
      { key: 'to', label: 'To date', type: 'date' },
    ],
    danger: 'critical',
  },
  {
    id: 'enrollments',
    title: 'Enrollments',
    description: 'Remove student enrollments from a class/section. Student records are preserved.',
    confirmText: 'DELETE ENROLLMENTS',
    endpoint: '/delete-data/enrollments',
    danger: 'high',
  },
  {
    id: 'guardians',
    title: 'Guardians',
    description: 'Remove guardian records. Will check for linked students before deletion.',
    confirmText: 'DELETE GUARDIANS',
    endpoint: '/delete-data/guardians',
    danger: 'high',
  },
  {
    id: 'students',
    title: 'Students',
    description: 'Soft-delete student profiles. All linked data (attendance, fees, exams) is preserved.',
    confirmText: 'DELETE STUDENTS',
    endpoint: '/delete-data/students',
    danger: 'critical',
  },
]

function DeleteModal({ entity, onClose }: { entity: DeleteEntity; onClose: () => void }) {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [confirmation, setConfirmation] = useState('')

  const confirmed = confirmation.trim().toUpperCase() === entity.confirmText

  const del = useMutation({
    mutationFn: () => api.delete(entity.endpoint, { data: filterValues }).then((r) => r.data),
    onSuccess: () => onClose(),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
        <div>
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
            {entity.danger === 'critical' ? 'Critical — irreversible action' : 'Warning — cannot be undone'}
          </p>
          <p className="mt-0.5 text-sm text-rose-600 dark:text-rose-300">{entity.description}</p>
        </div>
      </div>

      {entity.filters?.map((f) => (
        <div key={f.key} className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{f.label}</label>
          <input
            type={f.type}
            value={filterValues[f.key] ?? ''}
            onChange={(e) => setFilterValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      ))}

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Type <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{entity.confirmText}</span> to confirm
        </label>
        <input
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder={entity.confirmText}
          className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div className="flex justify-end gap-2">
        <DialogClose asChild><Button variant="ghost" size="sm">Cancel</Button></DialogClose>
        <button
          disabled={!confirmed || del.isPending}
          onClick={() => del.mutate()}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {del.isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Confirm deletion
        </button>
      </div>
      {del.isSuccess && <p className="text-center text-sm text-emerald-600">Deleted successfully. Audit log entry created.</p>}
      {del.isError && <p className="text-center text-sm text-rose-500">Deletion failed. Check permissions or contact support.</p>}
    </div>
  )
}

export default function DeleteDataPage() {
  const [activeEntity, setActiveEntity] = useState<DeleteEntity | null>(null)

  return (
    <div>
      <PageHeader
        title="Delete Data"
        subtitle="Admin-only controlled deletion with full audit logging."
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-700 dark:text-amber-300">
          All deletions are irreversible and create an audit log entry. Restricted to admin-level accounts.
          Proceed with caution.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ENTITIES.map((entity) => (
          <div
            key={entity.id}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/30">
                <Trash2 className="h-5 w-5 text-rose-500" />
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                entity.danger === 'critical'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
              }`}>
                {entity.danger === 'critical' ? 'Critical' : 'High risk'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{entity.title}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{entity.description}</p>
            </div>
            <button
              onClick={() => setActiveEntity(entity)}
              className="mt-auto rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
            >
              Delete {entity.title}
            </button>
          </div>
        ))}
      </div>

      <Dialog open={!!activeEntity} onOpenChange={(v) => !v && setActiveEntity(null)}>
        <DialogContent
          title={activeEntity ? `Delete ${activeEntity.title}` : ''}
          description="This action is permanent and cannot be undone."
        >
          {activeEntity && <DeleteModal entity={activeEntity} onClose={() => setActiveEntity(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
