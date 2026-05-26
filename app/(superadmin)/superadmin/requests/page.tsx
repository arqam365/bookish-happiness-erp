'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Plus, Mail, Phone, Users, MessageSquare, Calendar, CheckCircle2, XCircle, Clock, Building2 } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Select, SelectItem } from '@/components/ui/select'
import api from '@/lib/api'

dayjs.extend(relativeTime)

type RequestStatus = 'PENDING' | 'CONTACTED' | 'ONBOARDED' | 'REJECTED'

interface OnboardingRequest {
  id: string
  orgName: string
  orgType: string
  contactName: string
  contactEmail: string
  contactPhone: string | null
  estimatedStudents: number | null
  message: string | null
  status: RequestStatus
  notes: string | null
  createdAt: string
}

interface Counts { pending: number; contacted: number; onboarded: number; rejected: number; total: number }

const onboardSchema = z.object({
  orgName: z.string().min(1, 'Required'),
  orgType: z.enum(['SCHOOL', 'COLLEGE', 'MADRASA', 'COACHING', 'HYBRID']),
  orgSlug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
  adminFirstName: z.string().min(1, 'Required'),
  adminLastName: z.string().min(1, 'Required'),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
})
type OnboardForm = z.infer<typeof onboardSchema>

const TYPE_LABELS: Record<string, string> = {
  SCHOOL: 'School', COLLEGE: 'College', MADRASA: 'Madrasa', COACHING: 'Coaching', HYBRID: 'Hybrid',
}

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; icon: typeof Clock }> = {
  PENDING:   { label: 'Pending',   color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',    icon: Clock },
  CONTACTED: { label: 'Contacted', color: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',            icon: Mail },
  ONBOARDED: { label: 'Onboarded', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
  REJECTED:  { label: 'Rejected',  color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',        icon: XCircle },
}

function OnboardFromRequestModal({ request }: { request: OnboardingRequest }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<OnboardForm>({ resolver: zodResolver(onboardSchema) as any,
    defaultValues: {
      orgName: request.orgName,
      orgType: request.orgType as OnboardForm['orgType'],
      orgSlug: request.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      adminFirstName: request.contactName.split(' ')[0] ?? '',
      adminLastName: request.contactName.split(' ').slice(1).join(' ') || 'Admin',
      adminEmail: request.contactEmail,
      adminPassword: '',
    },
  })

  const onboard = useMutation({
    mutationFn: async (data: OnboardForm) => {
      await api.post('/superadmin/orgs', data)
      await api.patch(`/superadmin/onboarding-requests/${request.id}`, { status: 'ONBOARDED' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-requests'] })
      qc.invalidateQueries({ queryKey: ['sa-orgs'] })
      qc.invalidateQueries({ queryKey: ['sa-request-counts'] })
      setOpen(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5" />Onboard</Button>
      </DialogTrigger>
      <DialogContent title="Onboard organization" description="Pre-filled from the onboarding request. Set a password and confirm.">
        <form onSubmit={form.handleSubmit((d) => onboard.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Org name *" error={form.formState.errors.orgName?.message} {...form.register('orgName')} />
            <Input label="Slug *" error={form.formState.errors.orgSlug?.message} {...form.register('orgSlug')} />
          </div>
          <Select label="Type *" value={form.watch('orgType')} onValueChange={(v) => form.setValue('orgType', v as OnboardForm['orgType'])} placeholder="Select">
            {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </Select>
          <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Admin account</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="First name *" error={form.formState.errors.adminFirstName?.message} {...form.register('adminFirstName')} />
              <Input label="Last name *" error={form.formState.errors.adminLastName?.message} {...form.register('adminLastName')} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Input label="Email *" type="email" error={form.formState.errors.adminEmail?.message} {...form.register('adminEmail')} />
              <Input label="Set password *" type="password" error={form.formState.errors.adminPassword?.message} {...form.register('adminPassword')} />
            </div>
          </div>
          {onboard.error && (
            <p className="text-sm text-rose-500">{(onboard.error as any)?.response?.data?.message ?? 'Something went wrong'}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancel</Button></DialogClose>
            <Button type="submit" size="sm" loading={onboard.isPending}>Onboard & mark done</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StatusPill({ status }: { status: RequestStatus }) {
  const { label, color, icon: Icon } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      <Icon className="h-3 w-3" />{label}
    </span>
  )
}

const FILTER_TABS: { label: string; value: string }[] = [
  { label: 'All',       value: '' },
  { label: 'Pending',   value: 'PENDING' },
  { label: 'Contacted', value: 'CONTACTED' },
  { label: 'Onboarded', value: 'ONBOARDED' },
  { label: 'Rejected',  value: 'REJECTED' },
]

export default function RequestsPage() {
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data: counts } = useQuery<Counts>({
    queryKey: ['sa-request-counts'],
    queryFn: () => api.get('/superadmin/onboarding-requests/counts').then(r => r.data),
  })

  const { data: requests = [], isLoading } = useQuery<OnboardingRequest[]>({
    queryKey: ['sa-requests', filter],
    queryFn: () => api.get('/superadmin/onboarding-requests', { params: filter ? { status: filter } : {} }).then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RequestStatus }) =>
      api.patch(`/superadmin/onboarding-requests/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-requests'] })
      qc.invalidateQueries({ queryKey: ['sa-request-counts'] })
    },
  })

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Onboarding Requests</h1>
        <p className="mt-1 text-sm text-gray-500">Requests submitted via the public get-started form</p>
      </div>

      {/* Count cards */}
      {counts && (
        <div className="mb-6 grid grid-cols-4 gap-3">
          {[
            { label: 'Pending',   value: counts.pending,   color: 'text-amber-600' },
            { label: 'Contacted', value: counts.contacted, color: 'text-sky-600' },
            { label: 'Onboarded', value: counts.onboarded, color: 'text-emerald-600' },
            { label: 'Rejected',  value: counts.rejected,  color: 'text-rose-500' },
          ].map(c => (
            <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              <p className="mt-0.5 text-xs text-gray-400">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900 w-fit">
        {FILTER_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === t.value ? 'bg-[#4F46E5] text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-white dark:bg-gray-900" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="text-center">
            <Building2 className="mx-auto h-7 w-7 text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">No requests {filter ? `with status "${filter.toLowerCase()}"` : 'yet'}.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {requests.map((req) => (
              <div key={req.id}>
                {/* Row */}
                <button
                  onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-bold text-white">
                    {req.orgName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{req.orgName}</p>
                      <span className="text-[10px] font-medium text-gray-400">{TYPE_LABELS[req.orgType] ?? req.orgType}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{req.contactEmail}</span>
                      {req.contactPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{req.contactPhone}</span>}
                      {req.estimatedStudents && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{req.estimatedStudents} students</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusPill status={req.status} />
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {dayjs(req.createdAt).fromNow()}
                    </span>
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === req.id && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Contact</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{req.contactName}</p>
                        <p className="text-xs text-gray-500">{req.contactEmail}</p>
                        {req.contactPhone && <p className="text-xs text-gray-500">{req.contactPhone}</p>}
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Organization</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{req.orgName}</p>
                        <p className="text-xs text-gray-500">{TYPE_LABELS[req.orgType] ?? req.orgType}{req.estimatedStudents ? ` · ~${req.estimatedStudents} students` : ''}</p>
                      </div>
                      {req.message && (
                        <div className="col-span-2 sm:col-span-1">
                          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                            <MessageSquare className="h-3 w-3" />Message
                          </p>
                          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">{req.message}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {req.status === 'PENDING' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: req.id, status: 'CONTACTED' })}>
                          <Mail className="h-3.5 w-3.5" />Mark as contacted
                        </Button>
                      )}
                      {req.status !== 'ONBOARDED' && req.status !== 'REJECTED' && (
                        <OnboardFromRequestModal request={req} />
                      )}
                      {req.status !== 'REJECTED' && req.status !== 'ONBOARDED' && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: req.id, status: 'REJECTED' })}>
                          <XCircle className="h-3.5 w-3.5 text-rose-400" />Reject
                        </Button>
                      )}
                      {req.notes && (
                        <p className="ml-auto text-xs text-gray-400">Note: {req.notes}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
