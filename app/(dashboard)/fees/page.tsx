'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Plus, TrendingUp, Clock, AlertCircle, Printer } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Select, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import api from '@/lib/api'

interface FeeReceipt {
  receiptNo: string
  amount: number
  totalAmount: number
  discount: number
  lateFee: number
  paymentMethod: string | null
  paidAt: string
  student: { firstName: string; lastName: string; admissionNo: string }
  feeStructure: { name: string } | null
}

function ReceiptPrint({ receipt }: { receipt: FeeReceipt }) {
  const fmt = (n: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n)
  return (
    <div className="print-receipt mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="space-y-1 text-sm">
        <p className="text-center font-bold text-gray-900 dark:text-white">Fee Receipt</p>
        <p className="text-center text-xs text-gray-500">{dayjs(receipt.paidAt).format('D MMM YYYY, h:mm A')}</p>
        <hr className="my-2 border-gray-200 dark:border-gray-600" />
        <div className="flex justify-between"><span className="text-gray-500">Receipt No</span><span className="font-mono font-semibold text-gray-900 dark:text-white">{receipt.receiptNo}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Student</span><span className="text-gray-900 dark:text-white">{receipt.student.firstName} {receipt.student.lastName}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Admission No</span><span className="font-mono text-gray-900 dark:text-white">{receipt.student.admissionNo}</span></div>
        {receipt.feeStructure && <div className="flex justify-between"><span className="text-gray-500">Fee type</span><span className="text-gray-900 dark:text-white">{receipt.feeStructure.name}</span></div>}
        {receipt.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-emerald-600">-{fmt(receipt.discount)}</span></div>}
        {receipt.lateFee > 0 && <div className="flex justify-between"><span className="text-gray-500">Late fee</span><span className="text-rose-500">+{fmt(receipt.lateFee)}</span></div>}
        <hr className="my-2 border-gray-200 dark:border-gray-600" />
        <div className="flex justify-between text-base font-bold"><span>Total Paid</span><span className="text-[#4F46E5]">{fmt(receipt.totalAmount)}</span></div>
        {receipt.paymentMethod && <div className="flex justify-between text-xs"><span className="text-gray-500">Method</span><span className="text-gray-700 dark:text-gray-300">{receipt.paymentMethod.replace('_', ' ')}</span></div>}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        onClick={() => window.print()}
      >
        <Printer className="h-4 w-4" />
        Print receipt
      </Button>
    </div>
  )
}

interface DashboardStats { todayCollection: number; pendingAmount: number; pendingCount: number; overdueCount: number }
interface Defaulter {
  id: string
  receiptNo: string
  amount: number
  totalAmount: number
  dueDate: string | null
  status: string
  student: { id: string; firstName: string; lastName: string; admissionNo: string; phone: string | null }
  feeStructure: { name: string } | null
}

const collectSchema = z.object({
  studentId: z.string().min(1, 'Required'),
  amount: z.coerce.number().positive('Must be positive'),
  discount: z.coerce.number().min(0).optional(),
  lateFee: z.coerce.number().min(0).optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE']).optional(),
  remarks: z.string().optional(),
})
type CollectForm = z.infer<typeof collectSchema>

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

function CollectPaymentModal() {
  const [open, setOpen] = useState(false)
  const [receipt, setReceipt] = useState<FeeReceipt | null>(null)
  const qc = useQueryClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<CollectForm>({ resolver: zodResolver(collectSchema) as any })

  // Search student
  const [studentSearch, setStudentSearch] = useState('')
  const { data: studentsRes } = useQuery<{ data: Array<{ id: string; firstName: string; lastName: string; admissionNo: string }> }>({
    queryKey: ['students', { search: studentSearch }],
    queryFn: () => api.get('/students', { params: { search: studentSearch, limit: 10 } }).then((r) => r.data),
    enabled: studentSearch.length > 1,
  })
  const students = studentsRes?.data ?? []

  const collect = useMutation({
    mutationFn: (data: CollectForm) => api.post('/fees/collect', data).then((r) => r.data),
    onSuccess: (data: FeeReceipt) => {
      qc.invalidateQueries({ queryKey: ['fees-dashboard-stats'] })
      qc.invalidateQueries({ queryKey: ['fees-defaulters'] })
      setReceipt(data)
      form.reset()
      setStudentSearch('')
    },
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { form.reset(); setStudentSearch(''); setReceipt(null) } }}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" />Collect payment</Button>
      </DialogTrigger>
      <DialogContent title="Collect fee payment" description="Record a new payment and generate a receipt.">
        <form onSubmit={form.handleSubmit((d) => collect.mutate(d))} className="space-y-4">
          {/* Student search */}
          <div>
            <Input
              label="Search student"
              placeholder="Name or admission no…"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
            {students.length > 0 && !form.watch('studentId') && (
              <div className="mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {students.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => { form.setValue('studentId', s.id); setStudentSearch(`${s.firstName} ${s.lastName} (${s.admissionNo})`) }}
                  >
                    <span className="font-medium text-gray-900 dark:text-white">{s.firstName} {s.lastName}</span>
                    <span className="font-mono text-xs text-gray-400">{s.admissionNo}</span>
                  </button>
                ))}
              </div>
            )}
            {form.formState.errors.studentId && (
              <p className="mt-1 text-xs text-rose-500">{form.formState.errors.studentId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount *" type="number" min="0" error={form.formState.errors.amount?.message} {...form.register('amount')} />
            <Input label="Discount" type="number" min="0" {...form.register('discount')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Late fee" type="number" min="0" {...form.register('lateFee')} />
            <Select
              label="Payment method"
              value={form.watch('paymentMethod')}
              onValueChange={(v) => form.setValue('paymentMethod', v as any)}
              placeholder="Select"
            >
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              <SelectItem value="CHEQUE">Cheque</SelectItem>
              <SelectItem value="ONLINE">Online</SelectItem>
            </Select>
          </div>

          <Input label="Remarks" placeholder="Optional note" {...form.register('remarks')} />

          {!receipt && (
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancel</Button></DialogClose>
              <Button type="submit" size="sm" loading={collect.isPending}>Collect</Button>
            </div>
          )}
        </form>
        {receipt && <ReceiptPrint receipt={receipt} />}
      </DialogContent>
    </Dialog>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n)
}

export default function FeesPage() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['fees-dashboard-stats'],
    queryFn: () => api.get('/fees/dashboard-stats').then((r) => r.data),
  })

  const { data: defaulters = [], isLoading: defaultersLoading } = useQuery<Defaulter[]>({
    queryKey: ['fees-defaulters'],
    queryFn: () => api.get('/fees/defaulters').then((r) => r.data),
  })

  return (
    <div>
      <PageHeader title="Fees" subtitle="Collect payments and track defaulters." action={<CollectPaymentModal />} />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          label="Collected today"
          value={stats ? fmt(stats.todayCollection) : '—'}
          color="bg-emerald-50 dark:bg-emerald-900/30"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          label="Pending"
          value={stats ? fmt(stats.pendingAmount) : '—'}
          sub={stats ? `${stats.pendingCount} payments` : undefined}
          color="bg-amber-50 dark:bg-amber-900/30"
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5 text-rose-500" />}
          label="Overdue"
          value={stats ? String(stats.overdueCount) : '—'}
          sub="payments"
          color="bg-rose-50 dark:bg-rose-900/30"
        />
      </div>

      {/* Defaulters */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Fee defaulters</h3>
          <p className="mt-0.5 text-xs text-gray-500">Pending and overdue payments</p>
        </div>

        {defaultersLoading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="h-4 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        ) : defaulters.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No defaulters. All payments are up to date.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {defaulters.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {d.student.firstName} {d.student.lastName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {d.student.admissionNo}
                    {d.student.phone ? ` · ${d.student.phone}` : ''}
                    {d.feeStructure ? ` · ${d.feeStructure.name}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {d.dueDate && (
                    <p className="text-xs text-gray-400">Due: {dayjs(d.dueDate).format('D MMM YYYY')}</p>
                  )}
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(d.totalAmount)}</p>
                  <Badge variant={d.status === 'OVERDUE' ? 'danger' : 'warning'}>
                    {d.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
