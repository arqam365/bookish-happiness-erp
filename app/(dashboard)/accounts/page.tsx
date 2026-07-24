'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Plus, Search } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Select, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import api from '@/lib/api'

function fmt(n: number) {
  return new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

// ─── Day Book ─────────────────────────────────────────────────────────────────
interface DayBookEntry {
  id: string
  date: string
  description: string
  voucherNo: string
  debit: number
  credit: number
  account: { name: string }
}

function DayBookTab() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))

  const { data = [], isLoading } = useQuery<DayBookEntry[]>({
    queryKey: ['day-book', date],
    queryFn: () => api.get('/accounts/day-book', { params: { date } }).then((r) => r.data),
  })

  const totalDebit = data.reduce((s, e) => s + e.debit, 0)
  const totalCredit = data.reduce((s, e) => s + e.credit, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Voucher</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Account</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Debit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">No transactions on this date.</td></tr>
              ) : (
                data.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.voucherNo}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{e.account.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{e.description}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{e.debit ? fmt(e.debit) : '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{e.credit ? fmt(e.credit) : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
            {data.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
                  <td colSpan={3} className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Totals</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">{fmt(totalDebit)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">{fmt(totalCredit)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Voucher Entry ────────────────────────────────────────────────────────────
const voucherSchema = z.object({
  date: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  accountId: z.string().min(1, 'Required'),
  type: z.enum(['DEBIT', 'CREDIT']),
  amount: z.coerce.number().positive(),
  remarks: z.string().optional(),
})
type VoucherForm = z.infer<typeof voucherSchema>

interface Account { id: string; name: string; code: string }
interface VoucherRow { id: string; voucherNo: string; type: string; amount: number; description: string; date: string }

function VoucherTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<VoucherForm>({ resolver: zodResolver(voucherSchema) as any })

  const { data: accounts = [], refetch: refetchAccounts } = useQuery<Account[]>({
    queryKey: ['accounts-chart'],
    queryFn: () => api.get('/accounts/chart-of-accounts').then((r) => r.data),
  })

  const { data: voucherRes, isLoading: vouchersLoading } = useQuery<{ data: VoucherRow[]; total: number; totalPages: number }>({
    queryKey: ['accounts-vouchers', page],
    queryFn: () => api.get('/accounts/vouchers', { params: { page, limit: 20 } }).then((r) => r.data),
  })
  const vouchers = voucherRes?.data ?? []
  const totalPages = voucherRes?.totalPages ?? 1

  const create = useMutation({
    mutationFn: (data: VoucherForm) => api.post('/accounts/vouchers', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['day-book'] })
      qc.invalidateQueries({ queryKey: ['accounts-vouchers'] })
      setOpen(false)
      form.reset()
    },
  })

  const seedAccounts = useMutation({
    mutationFn: () => api.post('/accounts/seed-defaults').then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts-chart'] })
      refetchAccounts()
    },
  })

  const noAccounts = accounts.length === 0

  return (
    <div className="space-y-4">
      {noAccounts && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-300">No chart of accounts set up. Seed default school accounts to get started.</p>
          <Button size="sm" variant="outline" loading={seedAccounts.isPending} onClick={() => seedAccounts.mutate()}>
            Setup default accounts
          </Button>
        </div>
      )}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset() }}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={noAccounts}><Plus className="h-4 w-4" />New voucher</Button>
          </DialogTrigger>
          <DialogContent title="Voucher entry" description="Record a debit or credit entry.">
            <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date *" type="date" error={form.formState.errors.date?.message} {...form.register('date')} />
                <Select label="Type *" value={form.watch('type') ?? ''} onValueChange={(v) => form.setValue('type', v as 'DEBIT' | 'CREDIT')} placeholder="Select">
                  <SelectItem value="DEBIT">Debit</SelectItem>
                  <SelectItem value="CREDIT">Credit</SelectItem>
                </Select>
              </div>
              <Select label="Account *" value={form.watch('accountId') ?? ''} onValueChange={(v) => form.setValue('accountId', v)} placeholder="Select account" error={form.formState.errors.accountId?.message}>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
              </Select>
              <Input label="Amount *" type="number" min="0" error={form.formState.errors.amount?.message} {...form.register('amount')} />
              <Input label="Description *" error={form.formState.errors.description?.message} {...form.register('description')} />
              <Input label="Remarks" {...form.register('remarks')} />
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancel</Button></DialogClose>
                <Button type="submit" size="sm" loading={create.isPending}>Post voucher</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Voucher No</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {vouchersLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></td>)}</tr>
                ))
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">No vouchers posted yet.</td></tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">{v.voucherNo}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{dayjs(v.date).format('D MMM YY')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${v.type === 'JOURNAL' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {v.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.description}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{fmt(v.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
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

// ─── Ledger ───────────────────────────────────────────────────────────────────
interface LedgerEntry { id: string; date: string; description: string; voucherNo: string; debit: number; credit: number; balance: number }

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'] as const

function LedgerTab() {
  const qc = useQueryClient()
  const [accountId, setAccountId] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newType, setNewType] = useState('')

  const { data: chartAccounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts-chart'],
    queryFn: () => api.get('/accounts/chart-of-accounts').then((r) => r.data),
  })

  const { data = [], isLoading } = useQuery<LedgerEntry[]>({
    queryKey: ['ledger', accountId],
    queryFn: () => api.get(`/accounts/ledger/${accountId}`).then((r) => r.data),
    enabled: !!accountId,
  })

  const createAccount = useMutation({
    mutationFn: () => api.post('/accounts/chart-of-accounts', { name: newName, code: newCode, type: newType }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts-chart'] })
      setAddOpen(false)
      setNewName(''); setNewCode(''); setNewType('')
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[280px] flex-1">
          <Select label="Account" value={accountId} onValueChange={setAccountId} placeholder="Select account to view ledger">
            {chartAccounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
          </Select>
        </div>
        <div className="pb-0.5">
          <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) { setNewName(''); setNewCode(''); setNewType('') } }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4" />New account</Button>
            </DialogTrigger>
            <DialogContent title="New account" description="Add an account to your chart of accounts.">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Account code *" placeholder="e.g. 1002" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
                  <Select label="Type *" value={newType} onValueChange={setNewType} placeholder="Select type">
                    {ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>)}
                  </Select>
                </div>
                <Input label="Account name *" placeholder="e.g. Petty Cash" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <div className="flex justify-end gap-2 pt-2">
                  <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancel</Button></DialogClose>
                  <Button size="sm" loading={createAccount.isPending} disabled={!newName || !newCode || !newType} onClick={() => createAccount.mutate()}>
                    Add account
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!accountId ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-400">Select an account to view its ledger.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Voucher</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Credit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></td>)}</tr>
                  ))
                ) : data.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-gray-400">No entries for this account.</td></tr>
                ) : (
                  data.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                      <td className="px-4 py-3 text-xs text-gray-500">{dayjs(e.date).format('D MMM YY')}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.voucherNo}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{e.description}</td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{e.debit ? fmt(e.debit) : '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{e.credit ? fmt(e.credit) : '—'}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${e.balance >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{fmt(Math.abs(e.balance))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Collection ───────────────────────────────────────────────────────────────
interface CollectionRow {
  mode: string
  count: number
  amount: number
}

function CollectionTab() {
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'))

  const { data = [], isLoading } = useQuery<CollectionRow[]>({
    queryKey: ['accounts-collection', from, to],
    queryFn: () => api.get('/accounts/collection', { params: { from, to } }).then((r) => r.data),
  })

  const totalAmount = data.reduce((s, r) => s + r.amount, 0)
  const totalCount = data.reduce((s, r) => s + r.count, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Payment Mode</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Receipts</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>{[...Array(3)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></td>
                  ))}</tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={3} className="py-12 text-center text-sm text-gray-400">No collections in this period.</td></tr>
              ) : (
                data.map((r) => (
                  <tr key={r.mode} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{r.mode}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{r.count}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{fmt(r.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {data.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
                  <td className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Total</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">{totalCount}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">{fmt(totalAmount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Cash In Hand ─────────────────────────────────────────────────────────────
interface CashAccount {
  id: string
  name: string
  openingBalance: number
  receipts: number
  payments: number
  closingBalance: number
}

function CashInHandTab() {
  const { data = [], isLoading } = useQuery<CashAccount[]>({
    queryKey: ['accounts-cash-in-hand'],
    queryFn: () => api.get('/accounts/cash-in-hand').then((r) => r.data),
  })

  const totalClosing = data.reduce((s, a) => s + a.closingBalance, 0)

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Cash Account</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Opening</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Receipts</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Payments</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Closing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>{[...Array(5)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></td>
                  ))}</tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">No cash accounts configured.</td></tr>
              ) : (
                data.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{a.name}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{fmt(a.openingBalance)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{fmt(a.receipts)}</td>
                    <td className="px-4 py-3 text-right text-rose-500">{fmt(a.payments)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${a.closingBalance >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {fmt(a.closingBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {data.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
                  <td colSpan={4} className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Total Cash In Hand</td>
                  <td className={`px-4 py-3 text-right text-sm font-bold ${totalClosing >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {fmt(totalClosing)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Trial Balance ────────────────────────────────────────────────────────────
interface TrialBalanceRow {
  code: string
  name: string
  debit: number
  credit: number
}

function TrialBalanceTab() {
  const [asOf, setAsOf] = useState(dayjs().format('YYYY-MM-DD'))

  const { data = [], isLoading } = useQuery<TrialBalanceRow[]>({
    queryKey: ['trial-balance', asOf],
    queryFn: () => api.get('/accounts/trial-balance', { params: { asOf } }).then((r) => r.data),
  })

  const totalDebit = data.reduce((s, r) => s + r.debit, 0)
  const totalCredit = data.reduce((s, r) => s + r.credit, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">As of date</label>
          <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Code</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Account</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Debit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>{[...Array(4)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></td>
                  ))}</tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-sm text-gray-400">No trial balance data.</td></tr>
              ) : (
                data.map((r) => (
                  <tr key={r.code} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.code}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{r.name}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{r.debit ? fmt(r.debit) : '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{r.credit ? fmt(r.credit) : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
            {data.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
                  <td colSpan={2} className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Totals</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">{fmt(totalDebit)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">{fmt(totalCredit)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Receipts ─────────────────────────────────────────────────────────────────
interface Receipt {
  id: string
  receiptNo: string
  studentName: string
  admissionNo: string
  amount: number
  paymentMode: string
  feeType: string
  date: string
}

function ReceiptsTab() {
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'))
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<{ data: Receipt[]; total: number }>({
    queryKey: ['accounts-receipts', search, from, to, page],
    queryFn: () => api.get('/accounts/receipts', { params: { search, from, to, page, pageSize: 20 } }).then((r) => r.data),
  })

  const rows = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search student or receipt no…"
            className="rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500" />
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
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Receipt No</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Student</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Adm. No</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Fee Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Mode</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></td>)}</tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">No receipts found.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">{r.receiptNo}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.studentName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.admissionNo}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.feeType}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.paymentMode}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">{fmt(r.amount)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{dayjs(r.date).format('D MMM YY')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Page {page} of {totalPages} · {total} receipts</p>
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

// ─── Vendors ──────────────────────────────────────────────────────────────────
interface Vendor { id: string; name: string; phone?: string; email?: string; address?: string; balance: number }

const vendorSchema = z.object({
  name: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
})
type VendorForm = z.infer<typeof vendorSchema>

function VendorsTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<VendorForm>({ resolver: zodResolver(vendorSchema) as any })

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ['accounts-vendors'],
    queryFn: () => api.get('/accounts/vendors').then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: (d: VendorForm) => api.post('/accounts/vendors', d).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts-vendors'] }); setOpen(false); form.reset() },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset() }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4" />Add vendor</Button>
          </DialogTrigger>
          <DialogContent title="Add vendor" description="Register a new vendor or supplier.">
            <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="space-y-4">
              <Input label="Vendor name *" error={form.formState.errors.name?.message} {...form.register('name')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Phone" {...form.register('phone')} />
                <Input label="Email" type="email" {...form.register('email')} />
              </div>
              <Input label="Address" {...form.register('address')} />
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancel</Button></DialogClose>
                <Button type="submit" size="sm" loading={create.isPending}>Save vendor</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Phone</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Email</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Address</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>{[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></td>)}</tr>
                ))
              ) : vendors.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">No vendors added yet.</td></tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{v.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.address ?? '—'}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${v.balance >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {fmt(v.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AccountsPage() {
  return (
    <div>
      <PageHeader title="Accounts" subtitle="Day book, ledger, vouchers, and financial reports." />
      <Tabs defaultValue="daybook">
        <TabsList>
          <TabsTrigger value="daybook">Day Book</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="voucher">Voucher Entry</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="collection">Collection</TabsTrigger>
          <TabsTrigger value="cash">Cash In Hand</TabsTrigger>
          <TabsTrigger value="trial">Trial Balance</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>
        <TabsContent value="daybook"><DayBookTab /></TabsContent>
        <TabsContent value="ledger"><LedgerTab /></TabsContent>
        <TabsContent value="voucher"><VoucherTab /></TabsContent>
        <TabsContent value="receipts"><ReceiptsTab /></TabsContent>
        <TabsContent value="collection"><CollectionTab /></TabsContent>
        <TabsContent value="cash"><CashInHandTab /></TabsContent>
        <TabsContent value="trial"><TrialBalanceTab /></TabsContent>
        <TabsContent value="vendors"><VendorsTab /></TabsContent>
      </Tabs>
    </div>
  )
}
