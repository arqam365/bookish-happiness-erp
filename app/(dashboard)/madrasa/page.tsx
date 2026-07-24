'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Plus, BookOpen, Heart, HandCoins, Pencil, Trash2 } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Select, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

// ─── Hifz ────────────────────────────────────────────────────────────────────
interface HifzSummary { status: string; count: number }
interface HifzRecord {
  id: string
  surahName: string
  surahNumber: number
  fromAyat: number
  toAyat: number
  evaluatedAt: string
  status: string
  remarks: string | null
  student: { firstName: string; lastName: string; admissionNo: string }
}

const hifzSchema = z.object({
  studentId: z.string().min(1, 'Required'),
  surahFrom: z.coerce.number().int().min(1).max(114),
  surahTo: z.coerce.number().int().min(1).max(114),
  ayahFrom: z.coerce.number().int().min(1),
  ayahTo: z.coerce.number().int().min(1),
  status: z.enum(['COMPLETED', 'REVISION', 'WEAK']),
  remarks: z.string().optional(),
})

function HifzTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const form = useForm({ resolver: zodResolver(hifzSchema) })

  const { data: summary = [] } = useQuery<HifzSummary[]>({
    queryKey: ['hifz-summary'],
    queryFn: () => api.get('/madrasa/hifz/summary').then((r) => r.data),
  })

  const { data: hifzList = [], isLoading: listLoading } = useQuery<{ data: HifzRecord[] }>({
    queryKey: ['hifz-list'],
    queryFn: () => api.get('/madrasa/hifz').then((r) => r.data),
  })

  const { data: studentsRes } = useQuery<{ data: Array<{ id: string; firstName: string; lastName: string; admissionNo: string }> }>({
    queryKey: ['students', { search: studentSearch }],
    queryFn: () => api.get('/students', { params: { search: studentSearch, limit: 8 } }).then((r) => r.data),
    enabled: studentSearch.length > 1 && open,
  })
  const students = studentsRes?.data ?? []

  const record = useMutation({
    mutationFn: (data: any) => api.post('/madrasa/hifz', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hifz-summary'] })
      qc.invalidateQueries({ queryKey: ['hifz-list'] })
      setOpen(false); form.reset(); setStudentSearch('')
    },
  })

  const deleteHifz = useMutation({
    mutationFn: (id: string) => api.delete(`/madrasa/hifz/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hifz-summary'] })
      qc.invalidateQueries({ queryKey: ['hifz-list'] })
    },
  })

  const STATUS_COLORS: Record<string, 'success' | 'warning' | 'danger'> = {
    COMPLETED: 'success', REVISION: 'warning', WEAK: 'danger',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-3">
          {summary.map((s) => (
            <div key={s.status} className="rounded-lg border border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-xs text-gray-400">{s.status}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{s.count}</p>
            </div>
          ))}
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { form.reset(); setStudentSearch('') } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4" />Record Hifz</Button>
          </DialogTrigger>
          <DialogContent title="Record Hifz progress">
            <form onSubmit={form.handleSubmit((d) => record.mutate(d))} className="space-y-4">
              <div>
                <Input label="Student" placeholder="Search by name…" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                {students.length > 0 && !form.watch('studentId') && (
                  <div className="mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    {students.map((s) => (
                      <button key={s.id} type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => { form.setValue('studentId', s.id); setStudentSearch(`${s.firstName} ${s.lastName}`) }}
                      >
                        <span className="font-medium dark:text-white">{s.firstName} {s.lastName}</span>
                        <span className="text-xs text-gray-400">{s.admissionNo}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Surah from" type="number" min="1" max="114" {...form.register('surahFrom')} />
                <Input label="Surah to" type="number" min="1" max="114" {...form.register('surahTo')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Ayah from" type="number" min="1" {...form.register('ayahFrom')} />
                <Input label="Ayah to" type="number" min="1" {...form.register('ayahTo')} />
              </div>
              <Select label="Status" value={form.watch('status')} onValueChange={(v) => form.setValue('status', v as any)} placeholder="Select status">
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REVISION">Needs revision</SelectItem>
                <SelectItem value="WEAK">Weak</SelectItem>
              </Select>
              <Input label="Remarks" placeholder="Optional notes" {...form.register('remarks')} />
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancel</Button></DialogClose>
                <Button type="submit" size="sm" loading={record.isPending}>Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {listLoading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {[...Array(4)].map((_, i) => <div key={i} className="flex items-center gap-4 px-5 py-3"><div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></div>)}
          </div>
        ) : (hifzList as any)?.data?.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No Hifz records yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {((hifzList as any)?.data ?? []).map((h: HifzRecord) => (
              <div key={h.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {h.student.firstName} {h.student.lastName}
                    <span className="ml-2 text-xs font-normal text-gray-400">{h.student.admissionNo}</span>
                  </p>
                  <p className="text-xs text-gray-500">{h.surahName} · Ayah {h.fromAyat}–{h.toAyat}</p>
                  {h.remarks && <p className="text-xs text-gray-400 italic">{h.remarks}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_COLORS[h.status] ?? 'default'}>{h.status}</Badge>
                  <p className="text-xs text-gray-400">{dayjs(h.evaluatedAt).format('D MMM YYYY')}</p>
                  <button
                    title="Delete"
                    onClick={() => { if (confirm('Delete this Hifz record?')) deleteHifz.mutate(h.id) }}
                    className="rounded p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sponsorships ─────────────────────────────────────────────────────────────
interface Sponsorship {
  id: string
  sponsorName: string
  amount: number
  isActive: boolean
  student: { firstName: string; lastName: string; admissionNo: string }
}

const sponsorSchema = z.object({
  studentId: z.string().min(1, 'Required'),
  sponsorName: z.string().min(1, 'Required'),
  amount: z.coerce.number().positive(),
  startDate: z.string().min(1, 'Required'),
  remarks: z.string().optional(),
})

function SponsorshipsTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const form = useForm({ resolver: zodResolver(sponsorSchema) })

  const { data: sponsorships = [], isLoading } = useQuery<Sponsorship[]>({
    queryKey: ['sponsorships'],
    queryFn: () => api.get('/madrasa/sponsorships').then((r) => r.data),
  })

  const { data: studentsRes } = useQuery<{ data: Array<{ id: string; firstName: string; lastName: string; admissionNo: string }> }>({
    queryKey: ['students', { search: studentSearch }],
    queryFn: () => api.get('/students', { params: { search: studentSearch, limit: 8 } }).then((r) => r.data),
    enabled: studentSearch.length > 1 && open,
  })
  const students = studentsRes?.data ?? []

  const create = useMutation({
    mutationFn: (data: any) => api.post('/madrasa/sponsorships', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sponsorships'] }); setOpen(false); form.reset(); setStudentSearch('') },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { form.reset(); setStudentSearch('') } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4" />Add sponsorship</Button>
          </DialogTrigger>
          <DialogContent title="Add sponsorship">
            <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="space-y-4">
              <div>
                <Input label="Student" placeholder="Search by name…" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                {students.length > 0 && !form.watch('studentId') && (
                  <div className="mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    {students.map((s) => (
                      <button key={s.id} type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => { form.setValue('studentId', s.id); setStudentSearch(`${s.firstName} ${s.lastName}`) }}
                      >
                        <span className="font-medium dark:text-white">{s.firstName} {s.lastName}</span>
                        <span className="text-xs text-gray-400">{s.admissionNo}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Input label="Sponsor name *" placeholder="Sponsor or organization" error={form.formState.errors.sponsorName?.message as string} {...form.register('sponsorName')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Monthly amount *" type="number" min="0" error={form.formState.errors.amount?.message as string} {...form.register('amount')} />
                <Input label="Start date *" type="date" {...form.register('startDate')} />
              </div>
              <Input label="Remarks" placeholder="Optional" {...form.register('remarks')} />
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancel</Button></DialogClose>
                <Button type="submit" size="sm" loading={create.isPending}>Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {isLoading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {[...Array(5)].map((_, i) => <div key={i} className="flex items-center gap-4 px-5 py-3"><div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></div>)}
          </div>
        ) : sponsorships.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No sponsorships yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {sponsorships.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{s.student.firstName} {s.student.lastName}</p>
                  <p className="text-xs text-gray-400">{s.student.admissionNo} · Sponsor: {s.sponsorName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(s.amount)}/mo</p>
                  <Badge variant={s.isActive ? 'success' : 'default'}>{s.isActive ? 'Active' : 'Ended'}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Donations ────────────────────────────────────────────────────────────────
interface Donation { id: string; donorName: string; amount: number; type: string; date: string; remarks: string | null }
const DONATION_TYPES = ['ZAKAT', 'SADAQAH', 'WAQF', 'QURBANI', 'GENERAL']

const donationSchema = z.object({
  donorName: z.string().min(1, 'Required'),
  amount: z.coerce.number().positive(),
  type: z.enum(['ZAKAT', 'SADAQAH', 'WAQF', 'QURBANI', 'GENERAL']),
  date: z.string().min(1, 'Required'),
  remarks: z.string().optional(),
})

function DonationsTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const form = useForm({ resolver: zodResolver(donationSchema) })

  const { data: donations = [], isLoading } = useQuery<Donation[]>({
    queryKey: ['donations', typeFilter],
    queryFn: () => api.get('/madrasa/donations', { params: typeFilter ? { type: typeFilter } : {} }).then((r) => r.data),
  })

  const total = donations.reduce((s, d) => s + d.amount, 0)

  const create = useMutation({
    mutationFn: (data: any) => api.post('/madrasa/donations', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['donations'] }); setOpen(false); form.reset() },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[160px]">
          <Select label="Filter by type" value={typeFilter || '__all__'} onValueChange={(v) => setTypeFilter(v === '__all__' ? '' : v)} placeholder="All types">
            <SelectItem value="__all__">All types</SelectItem>
            {DONATION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </Select>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset() }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4" />Record donation</Button>
          </DialogTrigger>
          <DialogContent title="Record donation">
            <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="space-y-4">
              <Input label="Donor name *" error={form.formState.errors.donorName?.message as string} {...form.register('donorName')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Amount *" type="number" min="0" error={form.formState.errors.amount?.message as string} {...form.register('amount')} />
                <Select label="Type *" value={form.watch('type')} onValueChange={(v) => form.setValue('type', v as any)} placeholder="Select">
                  {DONATION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </Select>
              </div>
              <Input label="Date *" type="date" {...form.register('date')} />
              <Input label="Remarks" placeholder="Optional" {...form.register('remarks')} />
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancel</Button></DialogClose>
                <Button type="submit" size="sm" loading={create.isPending}>Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {total > 0 && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
          <p className="text-xs font-semibold uppercase text-emerald-600">Total donations{typeFilter ? ` (${typeFilter})` : ''}</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{fmt(total)}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {isLoading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {[...Array(5)].map((_, i) => <div key={i} className="flex items-center gap-4 px-5 py-3"><div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></div>)}
          </div>
        ) : donations.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No donations found.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {donations.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{d.donorName}</p>
                  <p className="text-xs text-gray-400">{dayjs(d.date).format('D MMM YYYY')}{d.remarks ? ` · ${d.remarks}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(d.amount)}</p>
                  <Badge variant="info">{d.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MadrasaPage() {
  const user = useAuthStore((s) => s.user)
  const orgType = user?.organization?.type

  if (orgType && orgType === 'SCHOOL') {
    return (
      <div>
        <PageHeader title="Madrasa" />
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-400">This module is only available for Madrasa and Hybrid institutions.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Madrasa" subtitle="Hifz progress, sponsorships, and donation ledger." />
      <Tabs defaultValue="hifz">
        <TabsList>
          <TabsTrigger value="hifz"><BookOpen className="mr-1.5 h-3.5 w-3.5" />Hifz Tracker</TabsTrigger>
          <TabsTrigger value="sponsorships"><Heart className="mr-1.5 h-3.5 w-3.5" />Sponsorships</TabsTrigger>
          <TabsTrigger value="donations"><HandCoins className="mr-1.5 h-3.5 w-3.5" />Donations</TabsTrigger>
        </TabsList>
        <TabsContent value="hifz"><HifzTab /></TabsContent>
        <TabsContent value="sponsorships"><SponsorshipsTab /></TabsContent>
        <TabsContent value="donations"><DonationsTab /></TabsContent>
      </Tabs>
    </div>
  )
}
