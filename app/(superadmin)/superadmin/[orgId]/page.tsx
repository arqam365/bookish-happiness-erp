'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { ArrowLeft, GraduationCap, Users, DollarSign, ClipboardList, CalendarDays, Globe, Mail, Phone, Clock, Banknote, Languages } from 'lucide-react'
import Link from 'next/link'
import dayjs from 'dayjs'
import api from '@/lib/api'

interface OrgDetail {
  id: string
  name: string
  type: string
  slug: string
  isActive: boolean
  email: string | null
  phone: string | null
  website: string | null
  createdAt: string
  institutes: Array<{
    id: string; name: string; type: string; code: string | null; isActive: boolean; createdAt: string
  }>
  orgSettings: { timezone: string; currency: string; language: string } | null
  _count: { users: number }
}

interface OrgStats {
  studentCount: number
  totalFeeCollection: number
  feeCollectionThisMonth: number
  examCount: number
  attendanceRecordsThisMonth: number
}

const TYPE_LABELS: Record<string, string> = {
  SCHOOL: 'School', COLLEGE: 'College', MADRASA: 'Madrasa', COACHING: 'Coaching', HYBRID: 'Hybrid',
}

const INST_TYPE_COLORS: Record<string, string> = {
  SCHOOL:   'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  COLLEGE:  'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  MADRASA:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  COACHING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  HYBRID:   'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function OrgInitial({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-base font-bold text-white shadow-md">
      {initials}
    </div>
  )
}

export default function OrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>()

  const { data: org, isLoading: orgLoading } = useQuery<OrgDetail>({
    queryKey: ['sa-org', orgId],
    queryFn: () => api.get(`/superadmin/orgs/${orgId}`).then((r) => r.data),
  })

  const { data: stats, isLoading: statsLoading } = useQuery<OrgStats>({
    queryKey: ['sa-org-stats', orgId],
    queryFn: () => api.get(`/superadmin/orgs/${orgId}/stats`).then((r) => r.data),
  })

  if (orgLoading) {
    return (
      <div className="max-w-5xl space-y-4">
        <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        <div className="h-40 animate-pulse rounded-2xl bg-white dark:bg-gray-900" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-white dark:bg-gray-900" />)}
        </div>
      </div>
    )
  }

  if (!org) return <p className="text-sm text-gray-400">Organization not found.</p>

  const currency = org.orgSettings?.currency ?? 'INR'

  const statCards = [
    {
      label: 'Total students',
      value: statsLoading ? '…' : fmt(stats?.studentCount ?? 0),
      icon: GraduationCap,
      accent: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    },
    {
      label: 'Staff accounts',
      value: fmt(org._count.users),
      icon: Users,
      accent: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
    },
    {
      label: 'Exams created',
      value: statsLoading ? '…' : fmt(stats?.examCount ?? 0),
      icon: ClipboardList,
      accent: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    },
    {
      label: 'Fee collected — all time',
      value: statsLoading ? '…' : `${currency} ${fmt(stats?.totalFeeCollection ?? 0)}`,
      icon: DollarSign,
      accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    {
      label: 'Fee collected — this month',
      value: statsLoading ? '…' : `${currency} ${fmt(stats?.feeCollectionThisMonth ?? 0)}`,
      icon: Banknote,
      accent: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    },
    {
      label: 'Attendance this month',
      value: statsLoading ? '…' : fmt(stats?.attendanceRecordsThisMonth ?? 0),
      icon: CalendarDays,
      accent: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    },
  ]

  return (
    <div className="max-w-5xl space-y-5">
      {/* Back */}
      <Link
        href="/superadmin"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All organizations
      </Link>

      {/* Header card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400" />
        <div className="p-6">
          <div className="flex items-start gap-4">
            <OrgInitial name={org.name} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{org.name}</h1>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${INST_TYPE_COLORS[org.type] ?? INST_TYPE_COLORS.HYBRID}`}>
                  {TYPE_LABELS[org.type] ?? org.type}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${org.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300'}`}>
                  {org.isActive ? 'Active' : 'Suspended'}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Since {dayjs(org.createdAt).format('D MMM YYYY')}
                </span>
                {org.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {org.email}
                  </span>
                )}
                {org.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {org.phone}
                  </span>
                )}
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-500 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {org.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>

            {/* Settings chips */}
            <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
              {[
                { icon: Clock, label: org.orgSettings?.timezone ?? '—' },
                { icon: Banknote, label: org.orgSettings?.currency ?? '—' },
                { icon: Languages, label: (org.orgSettings?.language ?? 'en').toUpperCase() },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  <Icon className="h-3 w-3" />{label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className={`mb-3 inline-flex rounded-lg p-2 ${s.accent}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">{s.value}</p>
            <p className="mt-0.5 text-xs text-gray-400 leading-snug">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Institutes */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Institutes</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {org.institutes.length}
          </span>
        </div>

        {org.institutes.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-gray-400">No institutes configured yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {org.institutes.map((inst) => (
              <div key={inst.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${INST_TYPE_COLORS[inst.type] ?? INST_TYPE_COLORS.HYBRID}`}>
                  {(TYPE_LABELS[inst.type] ?? 'H')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{inst.name}</p>
                  <p className="text-xs text-gray-400">
                    {TYPE_LABELS[inst.type] ?? inst.type}
                    {inst.code ? ` · ${inst.code}` : ''}
                    {' · Added '}
                    {dayjs(inst.createdAt).format('D MMM YYYY')}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${inst.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                  {inst.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
