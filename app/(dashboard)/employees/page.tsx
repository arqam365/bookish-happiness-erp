'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Search, Plus, UserCheck } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import api from '@/lib/api'
import { useDebounce } from '@/hooks/useDebounce'

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  designation: string
  department: string | null
  phone: string | null
  email: string | null
  joinDate: string
  isActive: boolean
}

interface EmployeesResponse {
  data: Employee[]
  total: number
  page: number
  pageSize: number
}

const employeeSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  designation: z.string().min(1, 'Required'),
  department: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  joinDate: z.string().min(1, 'Required'),
  emergencyContact: z.string().optional(),
  salary: z.coerce.number().optional(),
})
type EmployeeForm = z.infer<typeof employeeSchema>

function AddEmployeeModal() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<EmployeeForm>({ resolver: zodResolver(employeeSchema) as any })

  const create = useMutation({
    mutationFn: (d: EmployeeForm) => api.post('/employees', d).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setOpen(false); form.reset() },
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset() }}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" />Add employee</Button>
      </DialogTrigger>
      <DialogContent title="Add employee" description="Register a new employee or faculty member.">
        <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name *" error={form.formState.errors.firstName?.message} {...form.register('firstName')} />
            <Input label="Last name *" error={form.formState.errors.lastName?.message} {...form.register('lastName')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Designation *" placeholder="Teacher / Principal" error={form.formState.errors.designation?.message} {...form.register('designation')} />
            <Input label="Department" placeholder="Science / Admin" {...form.register('department')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" {...form.register('phone')} />
            <Input label="Email" type="email" {...form.register('email')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Join date *" type="date" error={form.formState.errors.joinDate?.message} {...form.register('joinDate')} />
            <Input label="Salary (optional)" type="number" min="0" {...form.register('salary')} />
          </div>
          <Input label="Emergency contact" placeholder="Name + phone" {...form.register('emergencyContact')} />
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancel</Button></DialogClose>
            <Button type="submit" size="sm" loading={create.isPending}>Save employee</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function EmployeesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 300)

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }, [])

  const { data, isLoading } = useQuery<EmployeesResponse>({
    queryKey: ['employees', debouncedSearch, department, page],
    queryFn: () => api.get('/employees', { params: { search: debouncedSearch, department, page, pageSize: 20 } }).then((r) => r.data),
  })

  const { data: departments = [] } = useQuery<string[]>({
    queryKey: ['employees-departments'],
    queryFn: () => api.get('/employees/departments').then((r) => r.data),
  })

  const rows = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage faculty, staff, and their profiles."
        action={<AddEmployeeModal />}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search by name, ID, or phone…"
            className="w-72 rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          />
        </div>
        <Select
          value={department}
          onValueChange={(v) => { setDepartment(v === '__all__' ? '' : v); setPage(1) }}
          placeholder="All departments"
          className="w-48"
        >
          <SelectItem value="__all__">All departments</SelectItem>
          {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Employee ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Designation</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Department</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Phone</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Join Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></td>
                  ))}</tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                    {search || department ? 'No employees match this filter.' : 'No employees added yet.'}
                  </td>
                </tr>
              ) : (
                rows.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer" onClick={() => router.push(`/employees/${emp.id}`)}>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">{emp.employeeId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-white/10">
                          <UserCheck className="h-4 w-4 text-indigo-500" />
                        </div>
                        {emp.firstName} {emp.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{emp.designation}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{emp.department ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{emp.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{dayjs(emp.joinDate).format('D MMM YYYY')}</td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.isActive ? 'success' : 'danger'}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} of {total}
            </p>
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
