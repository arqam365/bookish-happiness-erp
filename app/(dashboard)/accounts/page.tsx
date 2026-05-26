'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Plus } from 'lucide-react'
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

function VoucherTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<VoucherForm>({ resolver: zodResolver(voucherSchema) as any })

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts-chart'],
    queryFn: () => api.get('/accounts/chart-of-accounts').then((r) => r.data),
    enabled: open,
  })

  const create = useMutation({
    mutationFn: (data: VoucherForm) => api.post('/accounts/vouchers', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['day-book'] }); setOpen(false); form.reset() },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset() }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4" />New voucher</Button>
          </DialogTrigger>
          <DialogContent title="Voucher entry" description="Record a debit or credit entry.">
            <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date *" type="date" error={form.formState.errors.date?.message} {...form.register('date')} />
                <Select label="Type *" value={form.watch('type')} onValueChange={(v) => form.setValue('type', v as 'DEBIT' | 'CREDIT')} placeholder="Select">
                  <SelectItem value="DEBIT">Debit</SelectItem>
                  <SelectItem value="CREDIT">Credit</SelectItem>
                </Select>
              </div>
              <Select label="Account *" value={form.watch('accountId')} onValueChange={(v) => form.setValue('accountId', v)} placeholder="Select account" error={form.formState.errors.accountId?.message}>
                {accounts.length === 0
                  ? <SelectItem value="__none__">No accounts configured</SelectItem>
                  : accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)
                }
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

      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-400">Voucher history will appear here.</p>
      </div>
    </div>
  )
}

// ─── Ledger ───────────────────────────────────────────────────────────────────
interface LedgerEntry { id: string; date: string; description: string; voucherNo: string; debit: number; credit: number; balance: number }

function LedgerTab() {
  const [accountId, setAccountId] = useState('')

  const { data: chartAccounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts-chart'],
    queryFn: () => api.get('/accounts/chart-of-accounts').then((r) => r.data),
  })

  const { data = [], isLoading } = useQuery<LedgerEntry[]>({
    queryKey: ['ledger', accountId],
    queryFn: () => api.get(`/accounts/ledger/${accountId}`).then((r) => r.data),
    enabled: !!accountId,
  })

  return (
    <div className="space-y-4">
      <div className="min-w-[240px]">
        <Select label="Account" value={accountId} onValueChange={setAccountId} placeholder="Select account to view ledger">
          {chartAccounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
        </Select>
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AccountsPage() {
  return (
    <div>
      <PageHeader title="Accounts" subtitle="Day book, ledger, and voucher entries." />
      <Tabs defaultValue="daybook">
        <TabsList>
          <TabsTrigger value="daybook">Day Book</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="voucher">Voucher Entry</TabsTrigger>
        </TabsList>
        <TabsContent value="daybook"><DayBookTab /></TabsContent>
        <TabsContent value="ledger"><LedgerTab /></TabsContent>
        <TabsContent value="voucher"><VoucherTab /></TabsContent>
      </Tabs>
    </div>
  )
}
