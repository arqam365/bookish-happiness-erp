'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, Eye, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import api from '@/lib/api'
import { useDebounce } from '@/hooks/useDebounce'

interface Enrollment {
  class: { id: string; name: string }
  section: { id: string; name: string } | null
}

interface Student {
  id: string
  admissionNo: string
  firstName: string
  lastName: string
  gender: string | null
  phone: string | null
  dateOfBirth: string | null
  isActive: boolean
  enrollments: Enrollment[]
}

interface StudentsResponse {
  data: Student[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface ClassItem { id: string; name: string; sections: Array<{ id: string; name: string }> }

const col = createColumnHelper<Student>()

const GENDERS: Record<string, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' }

function formatDob(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function DeactivateCell({ student }: { student: Student }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const deactivate = useMutation({
    mutationFn: () => api.delete(`/students/${student.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      setOpen(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          title="View profile"
          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#4F46E5] dark:hover:bg-gray-700 transition-colors"
          onClick={(e) => { e.stopPropagation(); window.location.href = `/students/${student.id}` }}
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        {student.isActive && (
          <button
            title="Deactivate"
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 transition-colors"
            onClick={(e) => { e.stopPropagation(); setOpen(true) }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <DialogContent title="Deactivate student" description="This will mark the student as inactive. Records are preserved.">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Deactivate <strong>{student.firstName} {student.lastName}</strong>?
        </p>
        {deactivate.isError && (
          <p className="mt-2 text-sm text-red-500">
            {(deactivate.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong.'}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="sm">Cancel</Button>
          </DialogClose>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            loading={deactivate.isPending}
            onClick={() => deactivate.mutate()}
          >
            Deactivate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function StudentTable() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isFetching } = useQuery<StudentsResponse>({
    queryKey: ['students', { search: debouncedSearch, classId, sectionId, page }],
    queryFn: () =>
      api.get('/students', {
        params: {
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(classId && { classId }),
          ...(sectionId && { sectionId }),
          page,
          limit: 20,
        },
      }).then((r) => r.data),
  })

  const { data: classes = [] } = useQuery<ClassItem[]>({
    queryKey: ['settings-classes'],
    queryFn: () => api.get('/settings/classes').then((r) => r.data),
  })

  const selectedClass = classes.find((c) => c.id === classId)

  const handleClassChange = useCallback((v: string) => {
    setClassId(v === '__all__' ? '' : v)
    setSectionId('')
    setPage(1)
  }, [])

  const handleSectionChange = useCallback((v: string) => {
    setSectionId(v === '__all__' ? '' : v)
    setPage(1)
  }, [])

  const columns = [
    col.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => <DeactivateCell student={row.original} />,
    }),
    col.accessor('admissionNo', {
      header: 'Admission No',
      cell: (info) => <span className="font-mono text-xs text-gray-500">{info.getValue()}</span>,
    }),
    col.display({
      id: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {row.original.firstName} {row.original.lastName}
          </p>
        </div>
      ),
    }),
    col.display({
      id: 'class',
      header: 'Class / Section',
      cell: ({ row }) => {
        const enr = row.original.enrollments[0]
        if (!enr) return <span className="text-gray-400">—</span>
        return (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {enr.class.name}{enr.section ? ` · ${enr.section.name}` : ''}
          </span>
        )
      },
    }),
    col.accessor('gender', {
      header: 'Gender',
      cell: (info) => {
        const g = info.getValue()
        if (!g) return <span className="text-gray-400">—</span>
        return <span className="text-sm text-gray-600 dark:text-gray-300">{GENDERS[g] ?? g}</span>
      },
    }),
    col.accessor('phone', {
      header: 'Phone',
      cell: (info) => <span className="text-sm text-gray-600 dark:text-gray-300">{info.getValue() ?? '—'}</span>,
    }),
    col.accessor('dateOfBirth', {
      header: 'Date of birth',
      cell: (info) => <span className="text-sm text-gray-600 dark:text-gray-300">{formatDob(info.getValue())}</span>,
    }),
    col.accessor('isActive', {
      header: 'Status',
      cell: (info) => (
        <Badge variant={info.getValue() ? 'success' : 'default'}>
          {info.getValue() ? 'Active' : 'Inactive'}
        </Badge>
      ),
    }),
  ]

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages ?? 1,
  })

  const students = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-4">
      {/* Search + filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name or admission no…"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3.5 text-sm placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
          className={showFilters ? 'border-[#4F46E5] text-[#4F46E5]' : ''}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {(classId || sectionId) && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#4F46E5] text-[10px] text-white">
              {[classId, sectionId].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="min-w-[160px]">
            <Select
              label="Class"
              value={classId || '__all__'}
              onValueChange={handleClassChange}
              placeholder="All classes"
            >
              <SelectItem value="__all__">All classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </Select>
          </div>

          {selectedClass && selectedClass.sections.length > 0 && (
            <div className="min-w-[160px]">
              <Select
                label="Section"
                value={sectionId || '__all__'}
                onValueChange={handleSectionChange}
                placeholder="All sections"
              >
                <SelectItem value="__all__">All sections</SelectItem>
                {selectedClass.sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </Select>
            </div>
          )}

          {(classId || sectionId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setClassId(''); setSectionId(''); setPage(1) }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-sm text-gray-400">
                    {search || classId || sectionId ? 'No students match your filters.' : 'No students yet. Admit the first one!'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/students/${row.original.id}`)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total} students
              {isFetching && !isLoading && <span className="ml-2 opacity-60">(refreshing…)</span>}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-gray-500">{page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
