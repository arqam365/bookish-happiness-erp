'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, Pencil } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import api from '@/lib/api'

const staffSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  designation: z.string().min(1, 'Required'),
  department: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  emergencyContact: z.string().optional(),
  salary: z.string().optional(),
  joinDate: z.string().min(1, 'Required'),
})

type StaffForm = z.infer<typeof staffSchema>

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  designation: string
  department?: string | null
  phone?: string | null
  email?: string | null
  salary?: number | null
  joinDate: string
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED'
  isActive: boolean
}

const STATUS_BADGE: Record<
  Employee['status'],
  { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }
> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  ON_LEAVE: { label: 'On Leave', variant: 'warning' },
  RESIGNED: { label: 'Resigned', variant: 'danger' },
  TERMINATED: { label: 'Terminated', variant: 'danger' },
}

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

function StaffFormDialog({
  trigger,
  employee,
  onSuccess,
}: {
  trigger: React.ReactNode
  employee?: Employee
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
    defaultValues: employee
      ? {
          firstName: employee.firstName,
          lastName: employee.lastName,
          designation: employee.designation,
          department: employee.department ?? '',
          phone: employee.phone ?? '',
          email: employee.email ?? '',
          salary: employee.salary != null ? String(employee.salary) : '',
          joinDate: employee.joinDate.slice(0, 10),
        }
      : {},
  })

  const mutation = useMutation({
    mutationFn: (data: StaffForm) => {
      const payload = {
        ...data,
        salary: data.salary ? Number(data.salary) : undefined,
        email: data.email || undefined,
        department: data.department || undefined,
        emergencyContact: data.emergencyContact || undefined,
        phone: data.phone || undefined,
      }
      return employee
        ? api.patch(`/employees/${employee.id}`, payload).then((r) => r.data)
        : api.post('/employees', payload).then((r) => r.data)
    },
    onSuccess: () => {
      onSuccess()
      setOpen(false)
      if (!employee) reset()
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={employee ? 'Edit Staff Member' : 'Add Staff Member'}
        description={employee ? `Editing ${employee.firstName} ${employee.lastName}` : 'Enter the new staff member details.'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              placeholder="Ali"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last name"
              placeholder="Khan"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
            <Input
              label="Designation"
              placeholder="Science Teacher"
              error={errors.designation?.message}
              {...register('designation')}
            />
            <Input
              label="Department"
              placeholder="Science"
              {...register('department')}
            />
            <Input
              label="Phone"
              placeholder="+91 98765 43210"
              {...register('phone')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="ali@school.edu"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Emergency contact"
              placeholder="+91 98765 00000"
              {...register('emergencyContact')}
            />
            <Input
              label="Salary"
              type="number"
              min={0}
              placeholder="30000"
              {...register('salary')}
            />
            <Input
              label="Join date"
              type="date"
              error={errors.joinDate?.message}
              {...register('joinDate')}
            />
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-500">
              {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data
                ?.message ?? 'Something went wrong'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={mutation.isPending}>
              {employee ? 'Save changes' : 'Add staff'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function StaffSettings() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')

  const { data, isLoading } = useQuery<{ data: Employee[]; total: number }>({
    queryKey: ['settings-staff', search, department],
    queryFn: () =>
      api
        .get('/employees', {
          params: {
            search: search || undefined,
            department: department || undefined,
          },
        })
        .then((r) => r.data),
  })

  const { data: departments = [] } = useQuery<string[]>({
    queryKey: ['staff-departments'],
    queryFn: () => api.get('/employees/departments').then((r) => r.data),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['settings-staff'] })
    qc.invalidateQueries({ queryKey: ['staff-departments'] })
  }

  const staff = data?.data ?? []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Staff Members</CardTitle>
              <p className="mt-1 text-xs text-gray-500">
                {data?.total != null
                  ? `${data.total} member${data.total !== 1 ? 's' : ''} registered`
                  : 'Manage teaching and non-teaching staff.'}
              </p>
            </div>
            <StaffFormDialog
              trigger={
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Add staff
                </Button>
              }
              onSuccess={invalidate}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                placeholder="Search by name, ID, or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {departments.length > 0 && (
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
          </div>
        </CardHeader>

        {isLoading ? (
          <div className="space-y-2 mt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm font-medium text-gray-400">
              {search || department ? 'No staff match your filters.' : 'No staff added yet.'}
            </p>
            {!search && !department && (
              <p className="mt-1 text-xs text-gray-300">Click "Add staff" to get started.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800 mt-2">
            {staff.map((emp) => {
              const badge = STATUS_BADGE[emp.status] ?? { label: emp.status, variant: 'default' as const }
              return (
                <div key={emp.id} className="flex items-center gap-4 py-3 px-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {initials(emp.firstName, emp.lastName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {emp.firstName} {emp.lastName}
                      </span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {emp.designation}
                      {emp.department && ` · ${emp.department}`}
                      {emp.phone && ` · ${emp.phone}`}
                    </p>
                  </div>

                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-xs font-mono text-gray-400">{emp.employeeId}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(emp.joinDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <StaffFormDialog
                    trigger={
                      <button
                        type="button"
                        className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    }
                    employee={emp}
                    onSuccess={invalidate}
                  />
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
