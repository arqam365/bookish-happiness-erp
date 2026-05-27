'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Eye, Lock, Printer, QrCode } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useDebounce } from '@/hooks/useDebounce'

interface Guardian {
  id: string
  refId: string
  guardianId: string
  name: string
  phone: string | null
  email: string | null
  country: string | null
  state: string | null
  city: string | null
  address: string | null
  pincode: string | null
  googleMapLocation: string | null
  remarks: string | null
  createdAt: string
}

interface Sponsor {
  id: string
  refId: string
  sponsorId: string
  name: string
  phone: string | null
  email: string | null
  country: string | null
  organizationName: string | null
  sponsorshipType: string | null
  createdAt: string
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

function ActionButtons({ id }: { id: string }) {
  return (
    <div className="flex items-center gap-1">
      <button
        title="View"
        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      <button
        title="Permissions"
        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
      >
        <Lock className="h-3.5 w-3.5" />
      </button>
      <button
        title="Print"
        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
      >
        <Printer className="h-3.5 w-3.5" />
      </button>
      <button
        title="QR Code"
        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
      >
        <QrCode className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          ← Prev
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

function GuardiansTable() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 300)

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }, [])

  const { data, isLoading } = useQuery<PaginatedResponse<Guardian>>({
    queryKey: ['guardians', debouncedSearch, page],
    queryFn: () => api.get('/guardians', { params: { search: debouncedSearch, page, pageSize: 20 } }).then((r) => r.data),
  })

  const rows = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={handleSearch}
          placeholder="Search by name, guardian ID, or mobile…"
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Action</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Ref. Id</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Guardian ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Phone No.</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Email</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Country</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">State</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">City</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Address</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Pincode</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Map</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Remarks</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Created On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(14)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-16 text-center text-sm text-gray-400">
                    {search ? 'No guardians found for this search.' : 'No guardians added yet.'}
                  </td>
                </tr>
              ) : (
                rows.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3"><ActionButtons id={g.id} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{g.refId}</td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">{g.guardianId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{g.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{g.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{g.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{g.country ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{g.state ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{g.city ?? '—'}</td>
                    <td className="px-4 py-3 max-w-[160px] truncate text-gray-600 dark:text-gray-300" title={g.address ?? ''}>{g.address ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{g.pincode ?? '—'}</td>
                    <td className="px-4 py-3">
                      {g.googleMapLocation ? (
                        <a href={g.googleMapLocation} target="_blank" rel="noreferrer"
                          className="text-xs text-indigo-600 underline dark:text-indigo-400">View</a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 max-w-[120px] truncate text-gray-500" title={g.remarks ?? ''}>{g.remarks ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{dayjs(g.createdAt).format('D MMM YYYY')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={20} total={data?.total ?? 0} onPage={setPage} />
      </div>
    </div>
  )
}

function SponsorsTable() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 300)

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }, [])

  const { data, isLoading } = useQuery<PaginatedResponse<Sponsor>>({
    queryKey: ['sponsors', debouncedSearch, page],
    queryFn: () => api.get('/guardians/sponsors', { params: { search: debouncedSearch, page, pageSize: 20 } }).then((r) => r.data),
  })

  const rows = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={handleSearch}
          placeholder="Search by name, sponsor ID, or mobile…"
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Action</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Ref. Id</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Sponsor ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Phone No.</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Email</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Country</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Organization</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Sponsorship Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Created On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(10)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-sm text-gray-400">
                    {search ? 'No sponsors found for this search.' : 'No sponsors added yet.'}
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3"><ActionButtons id={s.id} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.refId}</td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">{s.sponsorId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.country ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.organizationName ?? '—'}</td>
                    <td className="px-4 py-3">
                      {s.sponsorshipType ? <Badge variant="default">{s.sponsorshipType}</Badge> : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{dayjs(s.createdAt).format('D MMM YYYY')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={20} total={data?.total ?? 0} onPage={setPage} />
      </div>
    </div>
  )
}

export default function GuardiansPage() {
  return (
    <div>
      <PageHeader title="Guardians" subtitle="Manage guardians and sponsors linked to students." />
      <Tabs defaultValue="guardians">
        <TabsList>
          <TabsTrigger value="guardians">Guardians</TabsTrigger>
          <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
        </TabsList>
        <TabsContent value="guardians"><GuardiansTable /></TabsContent>
        <TabsContent value="sponsors"><SponsorsTable /></TabsContent>
      </Tabs>
    </div>
  )
}
