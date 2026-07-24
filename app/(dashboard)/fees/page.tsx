'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Plus, TrendingUp, Clock, AlertCircle, Printer, Search } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Select, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import api from '@/lib/api'

const fmtCur = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

// ─── Types ────────────────────────────────────────────────────────────────────
interface FeeReceipt {
  receiptNo: string; amount: number; totalAmount: number; discount: number; lateFee: number
  paymentMethod: string | null; paidAt: string
  student: { firstName: string; lastName: string; admissionNo: string }
  feeStructure: { name: string } | null
}
interface DashboardStats { todayCollection: number; pendingAmount: number; pendingCount: number; overdueCount: number }
interface Defaulter {
  id: string; receiptNo: string; amount: number; totalAmount: number; dueDate: string | null; status: string
  student: { id: string; firstName: string; lastName: string; admissionNo: string; phone: string | null }
  feeStructure: { name: string } | null
}
interface PaymentRow {
  id: string; receiptNo: string; studentName: string; admissionNo: string; feeType: string
  amount: number; discount: number; lateFee: number; totalAmount: number
  paymentMethod: string; paidAt: string; remarks: string | null
}
interface FeeCategory { id: string; name: string }
interface FeeStructure { id: string; name: string; amount: number; dueDay: number | null; lateFeeAmount: number | null; feeCategory: { name: string }; academicYear: { name: string } }
interface AcademicYear { id: string; name: string; isActive: boolean }

// ─── Receipt Print ────────────────────────────────────────────────────────────
function ReceiptPrint({ receipt }: { receipt: FeeReceipt }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="space-y-1 text-sm">
        <p className="text-center font-bold text-gray-900 dark:text-white">Fee Receipt</p>
        <p className="text-center text-xs text-gray-500">{dayjs(receipt.paidAt).format('D MMM YYYY, h:mm A')}</p>
        <hr className="my-2 border-gray-200 dark:border-gray-600" />
        <div className="flex justify-between"><span className="text-gray-500">Receipt No</span><span className="font-mono font-semibold text-gray-900 dark:text-white">{receipt.receiptNo}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Student</span><span className="text-gray-900 dark:text-white">{receipt.student.firstName} {receipt.student.lastName}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Adm. No</span><span className="font-mono text-gray-900 dark:text-white">{receipt.student.admissionNo}</span></div>
        {receipt.feeStructure && <div className="flex justify-between"><span className="text-gray-500">Fee type</span><span className="text-gray-900 dark:text-white">{receipt.feeStructure.name}</span></div>}
        {receipt.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-emerald-600">-{fmtCur(receipt.discount)}</span></div>}
        {receipt.lateFee > 0 && <div className="flex justify-between"><span className="text-gray-500">Late fee</span><span className="text-rose-500">+{fmtCur(receipt.lateFee)}</span></div>}
        <hr className="my-2 border-gray-200 dark:border-gray-600" />
        <div className="flex justify-between text-base font-bold"><span>Total Paid</span><span className="text-[#4F46E5]">{fmtCur(receipt.totalAmount)}</span></div>
        {receipt.paymentMethod && <div className="flex justify-between text-xs"><span className="text-gray-500">Method</span><span className="text-gray-700 dark:text-gray-300">{receipt.paymentMethod.replace('_', ' ')}</span></div>}
      </div>
      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />Print receipt
      </Button>
    </div>
  )
}

// ─── Collect Payment Modal ─────────────────────────────────────────────────────
const collectSchema = z.object({
  studentId: z.string().min(1, 'Required'),
  feeStructureId: z.string().optional(),
  amount: z.coerce.number().positive('Must be positive'),
  discount: z.coerce.number().min(0).optional(),
  lateFee: z.coerce.number().min(0).optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE']).optional(),
  remarks: z.string().optional(),
})
type CollectForm = z.infer<typeof collectSchema>

function CollectPaymentModal() {
  const [open, setOpen] = useState(false)
  const [receipt, setReceipt] = useState<FeeReceipt | null>(null)
  const [studentSearch, setStudentSearch] = useState('')
  const qc = useQueryClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<CollectForm>({ resolver: zodResolver(collectSchema) as any })

  const { data: studentsRes } = useQuery<{ data: Array<{ id: string; firstName: string; lastName: string; admissionNo: string }> }>({
    queryKey: ['students', { search: studentSearch }],
    queryFn: () => api.get('/students', { params: { search: studentSearch, limit: 10 } }).then((r) => r.data),
    enabled: studentSearch.length > 1,
  })
  const students = studentsRes?.data ?? []

  const { data: structures = [] } = useQuery<FeeStructure[]>({
    queryKey: ['fees-structures'],
    queryFn: () => api.get('/fees/structures').then((r) => r.data),
    enabled: open,
  })

  const selectedStructure = structures.find((s) => s.id === form.watch('feeStructureId'))

  const collect = useMutation({
    mutationFn: (data: CollectForm) => api.post('/fees/collect', data).then((r) => r.data),
    onSuccess: (data: FeeReceipt) => {
      qc.invalidateQueries({ queryKey: ['fees-dashboard-stats'] })
      qc.invalidateQueries({ queryKey: ['fees-defaulters'] })
      qc.invalidateQueries({ queryKey: ['fees-history'] })
      setReceipt(data)
      form.reset()
      setStudentSearch('')
    },
  })

  function handleClose(v: boolean) {
    setOpen(v)
    if (!v) { form.reset(); setStudentSearch(''); setReceipt(null) }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
              onChange={(e) => { setStudentSearch(e.target.value); form.setValue('studentId', '') }}
            />
            {students.length > 0 && !form.watch('studentId') && (
              <div className="mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {students.map((s) => (
                  <button key={s.id} type="button"
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => { form.setValue('studentId', s.id); setStudentSearch(`${s.firstName} ${s.lastName} (${s.admissionNo})`) }}
                  >
                    <span className="font-medium text-gray-900 dark:text-white">{s.firstName} {s.lastName}</span>
                    <span className="font-mono text-xs text-gray-400">{s.admissionNo}</span>
                  </button>
                ))}
              </div>
            )}
            {form.formState.errors.studentId && <p className="mt-1 text-xs text-rose-500">{form.formState.errors.studentId.message}</p>}
          </div>

          {/* Fee structure picker */}
          <Select
            label="Fee type (optional)"
            value={form.watch('feeStructureId') ?? ''}
            onValueChange={(v) => {
              form.setValue('feeStructureId', v)
              const s = structures.find((x) => x.id === v)
              if (s) form.setValue('amount', Number(s.amount))
            }}
            placeholder="Select fee type…"
          >
            {structures.length === 0
              ? <SelectItem value="__none__">No fee types configured</SelectItem>
              : structures.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {fmtCur(Number(s.amount))} ({s.academicYear.name})
                  </SelectItem>
                ))
            }
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount (INR) *" type="number" min="0" error={form.formState.errors.amount?.message} {...form.register('amount')} />
            <Input label="Discount" type="number" min="0" {...form.register('discount')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Late fee" type="number" min="0"
              defaultValue={selectedStructure?.lateFeeAmount ?? undefined}
              {...form.register('lateFee')}
            />
            <Select label="Payment method" value={form.watch('paymentMethod') ?? ''} onValueChange={(v) => form.setValue('paymentMethod', v as any)} placeholder="Select">
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

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${color}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['fees-dashboard-stats'],
    queryFn: () => api.get('/fees/dashboard-stats').then((r) => r.data),
  })

  const { data: defaultersRes, isLoading: defaultersLoading } = useQuery<{ data: Defaulter[]; total: number }>({
    queryKey: ['fees-defaulters'],
    queryFn: () => api.get('/fees/defaulters', { params: { limit: 50 } }).then((r) => r.data),
  })
  const defaulters = defaultersRes?.data ?? []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<TrendingUp className="h-5 w-5 text-emerald-600" />} label="Collected today" value={stats ? fmtCur(stats.todayCollection) : '—'} color="bg-emerald-50 dark:bg-emerald-900/30" />
        <StatCard icon={<Clock className="h-5 w-5 text-amber-500" />} label="Pending" value={stats ? fmtCur(stats.pendingAmount) : '—'} sub={stats ? `${stats.pendingCount} payments` : undefined} color="bg-amber-50 dark:bg-amber-900/30" />
        <StatCard icon={<AlertCircle className="h-5 w-5 text-rose-500" />} label="Overdue" value={stats ? String(stats.overdueCount) : '—'} sub="payments" color="bg-rose-50 dark:bg-rose-900/30" />
      </div>

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
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{d.student.firstName} {d.student.lastName}</p>
                  <p className="text-xs text-gray-400">
                    {d.student.admissionNo}
                    {d.student.phone ? ` · ${d.student.phone}` : ''}
                    {d.feeStructure ? ` · ${d.feeStructure.name}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {d.dueDate && <p className="text-xs text-gray-400">Due: {dayjs(d.dueDate).format('D MMM YYYY')}</p>}
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmtCur(d.totalAmount)}</p>
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

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab() {
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'))
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<{ data: PaymentRow[]; total: number; totalPages: number }>({
    queryKey: ['fees-history', search, from, to, page],
    queryFn: () => api.get('/fees/history', { params: { search, from, to, page, limit: 20 } }).then((r) => r.data),
  })
  const rows = data?.data ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search student or receipt…"
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">From</label>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">To</label>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Receipt</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Student</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Fee Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Method</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></td>)}</tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">No payments found.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">{r.receiptNo}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{r.studentName}</p>
                      <p className="text-xs text-gray-400">{r.admissionNo}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.feeType}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{r.paymentMethod.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">{fmt(r.totalAmount)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{dayjs(r.paidAt).format('D MMM YY, h:mm A')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-700">
            <p className="text-xs text-gray-500">Page {page} of {totalPages} · {total} records</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}
                className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700">← Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}
                className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Fee Structures Tab ───────────────────────────────────────────────────────
function FeeStructuresTab() {
  const qc = useQueryClient()
  const [catOpen, setCatOpen] = useState(false)
  const [structOpen, setStructOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  const structForm = useForm<{ name: string; feeCategoryId: string; academicYearId: string; amount: number; dueDay?: number; lateFeeAmount?: number }>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(z.object({
      name: z.string().min(1, 'Required'),
      feeCategoryId: z.string().min(1, 'Required'),
      academicYearId: z.string().min(1, 'Required'),
      amount: z.coerce.number().positive(),
      dueDay: z.coerce.number().min(1).max(31).optional(),
      lateFeeAmount: z.coerce.number().min(0).optional(),
    })) as any,
  })

  const { data: categories = [] } = useQuery<FeeCategory[]>({
    queryKey: ['fees-categories'],
    queryFn: () => api.get('/fees/categories').then((r) => r.data),
  })

  const { data: structures = [], isLoading } = useQuery<FeeStructure[]>({
    queryKey: ['fees-structures'],
    queryFn: () => api.get('/fees/structures').then((r) => r.data),
  })

  const { data: years = [] } = useQuery<AcademicYear[]>({
    queryKey: ['settings-academic-years'],
    queryFn: () => api.get('/settings/academic-years').then((r) => r.data),
    enabled: structOpen,
  })

  const createCat = useMutation({
    mutationFn: () => api.post('/fees/categories', { name: newCatName }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fees-categories'] }); setCatOpen(false); setNewCatName('') },
  })

  const createStruct = useMutation({
    mutationFn: (d: any) => api.post('/fees/structures', d).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fees-structures'] }); setStructOpen(false); structForm.reset() },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} · {structures.length} fee {structures.length === 1 ? 'structure' : 'structures'}
          </p>
        </div>
        <div className="flex gap-2">
          {/* New Category */}
          <Dialog open={catOpen} onOpenChange={(v) => { setCatOpen(v); if (!v) setNewCatName('') }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4" />New category</Button>
            </DialogTrigger>
            <DialogContent title="New fee category" description="Categories group fee types (e.g. Tuition, Hostel, Transport).">
              <div className="space-y-4">
                <Input label="Category name *" placeholder="e.g. Tuition Fee" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                <div className="flex justify-end gap-2 pt-2">
                  <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancel</Button></DialogClose>
                  <Button size="sm" loading={createCat.isPending} disabled={!newCatName} onClick={() => createCat.mutate()}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* New Structure */}
          <Dialog open={structOpen} onOpenChange={(v) => { setStructOpen(v); if (!v) structForm.reset() }}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={categories.length === 0}><Plus className="h-4 w-4" />New fee structure</Button>
            </DialogTrigger>
            <DialogContent title="New fee structure" description="Define a specific fee amount for a category and academic year.">
              <form onSubmit={structForm.handleSubmit((d) => createStruct.mutate(d))} className="space-y-4">
                <Input label="Name *" placeholder="e.g. Monthly Tuition Fee" error={structForm.formState.errors.name?.message} {...structForm.register('name')} />
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Category *" value={structForm.watch('feeCategoryId') ?? ''} onValueChange={(v) => structForm.setValue('feeCategoryId', v)} placeholder="Select" error={structForm.formState.errors.feeCategoryId?.message}>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </Select>
                  <Select label="Academic year *" value={structForm.watch('academicYearId') ?? ''} onValueChange={(v) => structForm.setValue('academicYearId', v)} placeholder="Select" error={structForm.formState.errors.academicYearId?.message}>
                    {years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}{y.isActive ? ' (Active)' : ''}</SelectItem>)}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Amount (INR) *" type="number" min="0" error={structForm.formState.errors.amount?.message} {...structForm.register('amount')} />
                  <Input label="Due day (1–31)" type="number" min="1" max="31" placeholder="e.g. 10" {...structForm.register('dueDay')} />
                </div>
                <Input label="Late fee (INR)" type="number" min="0" placeholder="0" {...structForm.register('lateFeeAmount')} />
                <div className="flex justify-end gap-2 pt-2">
                  <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancel</Button></DialogClose>
                  <Button type="submit" size="sm" loading={createStruct.isPending}>Create</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {categories.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
          Create a category first (e.g. &quot;Tuition Fee&quot;), then create fee structures under it.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Category</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Academic Year</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Amount</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-500">Due Day</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Late Fee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></td>)}</tr>
              ))
            ) : structures.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">No fee structures defined yet.</td></tr>
            ) : (
              structures.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.feeCategory.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.academicYear.name}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{fmtCur(Number(s.amount))}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{s.dueDay ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-rose-500">{s.lateFeeAmount ? fmtCur(Number(s.lateFeeAmount)) : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FeesPage() {
  return (
    <div>
      <PageHeader title="Fees" subtitle="Collect payments, view history, and manage fee structures." action={<CollectPaymentModal />} />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="history"><HistoryTab /></TabsContent>
        <TabsContent value="structures"><FeeStructuresTab /></TabsContent>
      </Tabs>
    </div>
  )
}
