'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Plus, Building2, GraduationCap, Users, ChevronRight, Search } from 'lucide-react'
import Link from 'next/link'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Select, SelectItem } from '@/components/ui/select'
import api from '@/lib/api'

interface OrgRow {
  id: string
  name: string
  type: string
  slug: string
  isActive: boolean
  createdAt: string
  instituteCount: number
  userCount: number
  studentCount: number
}

const onboardSchema = z.object({
  orgName: z.string().min(1, 'Required'),
  orgType: z.enum(['SCHOOL', 'COLLEGE', 'MADRASA', 'COACHING', 'HYBRID']),
  orgSlug: z.string().min(2, 'Min 2 chars').regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
  adminFirstName: z.string().min(1, 'Required'),
  adminLastName: z.string().min(1, 'Required'),
  adminEmail: z.string().email('Valid email required'),
  adminPassword: z.string().min(8, 'Min 8 characters'),
})
type OnboardForm = z.infer<typeof onboardSchema>

function OnboardModal() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<OnboardForm>({ resolver: zodResolver(onboardSchema) as any })

  const onboard = useMutation({
    mutationFn: (data: OnboardForm) => api.post('/superadmin/orgs', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-orgs'] }); setOpen(false); form.reset() },
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset() }}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" />Onboard organization</Button>
      </DialogTrigger>
      <DialogContent title="Onboard new organization" description="Create a new org and their first admin account.">
        <form onSubmit={form.handleSubmit((d) => onboard.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Org name *" placeholder="Al Noor Trust" error={form.formState.errors.orgName?.message} {...form.register('orgName')} />
            <Input label="Slug *" placeholder="al-noor-trust" error={form.formState.errors.orgSlug?.message} {...form.register('orgSlug')} />
          </div>
          <Select label="Org type *" value={form.watch('orgType')} onValueChange={(v) => form.setValue('orgType', v as OnboardForm['orgType'])} placeholder="Select type" error={form.formState.errors.orgType?.message}>
            <SelectItem value="SCHOOL">School</SelectItem>
            <SelectItem value="COLLEGE">College</SelectItem>
            <SelectItem value="MADRASA">Madrasa</SelectItem>
            <SelectItem value="COACHING">Coaching</SelectItem>
            <SelectItem value="HYBRID">Hybrid</SelectItem>
          </Select>
          <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Admin account</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="First name *" error={form.formState.errors.adminFirstName?.message} {...form.register('adminFirstName')} />
              <Input label="Last name *" error={form.formState.errors.adminLastName?.message} {...form.register('adminLastName')} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Input label="Email *" type="email" error={form.formState.errors.adminEmail?.message} {...form.register('adminEmail')} />
              <Input label="Password *" type="password" error={form.formState.errors.adminPassword?.message} {...form.register('adminPassword')} />
            </div>
          </div>
          {onboard.error && (
            <p className="text-sm text-rose-500">{(onboard.error as any)?.response?.data?.message ?? 'Something went wrong'}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancel</Button></DialogClose>
            <Button type="submit" size="sm" loading={onboard.isPending}>Onboard</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const TYPE_COLORS: Record<string, string> = {
  SCHOOL:   'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  COLLEGE:  'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  MADRASA:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  COACHING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  HYBRID:   'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
}
const TYPE_LABELS: Record<string, string> = {
  SCHOOL: 'School', COLLEGE: 'College', MADRASA: 'Madrasa', COACHING: 'Coaching', HYBRID: 'Hybrid',
}

function OrgInitial({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-bold text-white shadow-sm">
      {initials}
    </div>
  )
}

export default function SuperAdminPage() {
  const [search, setSearch] = useState('')

  const { data: orgs = [], isLoading } = useQuery<OrgRow[]>({
    queryKey: ['sa-orgs'],
    queryFn: () => api.get('/superadmin/orgs').then((r) => r.data),
  })

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.slug.toLowerCase().includes(search.toLowerCase())
  )

  const totalStudents = orgs.reduce((s, o) => s + o.studentCount, 0)
  const activeOrgs = orgs.filter(o => o.isActive && o.slug !== 'revzion').length

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Organizations</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all client organizations on the platform</p>
        </div>
        <OnboardModal />
      </div>

      {/* Summary strip */}
      {!isLoading && orgs.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Client orgs', value: activeOrgs, icon: Building2, color: 'text-indigo-500' },
            { label: 'Total students', value: totalStudents.toLocaleString(), icon: GraduationCap, color: 'text-emerald-500' },
            { label: 'Total staff', value: orgs.reduce((s, o) => s + o.userCount, 0), icon: Users, color: 'text-sky-500' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
              <div className={`rounded-lg bg-gray-50 p-2 dark:bg-gray-800 ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none text-gray-900 dark:text-white">{s.value}</p>
                <p className="mt-0.5 text-xs text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-900">
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or slug…"
          className="flex-1 bg-transparent py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-white"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-xl bg-white dark:bg-gray-900" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="text-center">
            <Building2 className="mx-auto h-7 w-7 text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">{search ? 'No results found.' : 'No organizations yet.'}</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((org) => (
              <Link
                key={org.id}
                href={`/superadmin/${org.id}`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              >
                <OrgInitial name={org.name} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{org.name}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[org.type] ?? TYPE_COLORS.HYBRID}`}>
                      {TYPE_LABELS[org.type] ?? org.type}
                    </span>
                    {!org.isActive && (
                      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
                        Suspended
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    {org.slug} · since {dayjs(org.createdAt).format('MMM YYYY')}
                  </p>
                </div>

                <div className="flex items-center gap-7 text-right">
                  <div>
                    <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{org.instituteCount}</p>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">Institutes</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{org.studentCount.toLocaleString()}</p>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">Students</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{org.userCount}</p>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">Staff</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-[#4F46E5]" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
