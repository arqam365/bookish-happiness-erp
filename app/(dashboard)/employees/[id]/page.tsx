'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, UserCheck, Phone, Mail, Briefcase, Calendar, DollarSign, Pencil, X, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'
import dayjs from 'dayjs'

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  designation: string
  department: string | null
  phone: string | null
  email: string | null
  emergencyContact: string | null
  salary: number | null
  joinDate: string
  isActive: boolean
  status: string
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white">{value ?? '—'}</span>
    </div>
  )
}

function EditOverviewForm({ employee, onDone }: { employee: Employee; onDone: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    firstName: employee.firstName,
    lastName: employee.lastName,
    designation: employee.designation,
    department: employee.department ?? '',
    phone: employee.phone ?? '',
    email: employee.email ?? '',
    emergencyContact: employee.emergencyContact ?? '',
    salary: employee.salary != null ? String(employee.salary) : '',
  })

  const save = useMutation({
    mutationFn: (d: typeof form) =>
      api.patch(`/employees/${employee.id}`, {
        ...d,
        department: d.department || undefined,
        phone: d.phone || undefined,
        email: d.email || undefined,
        emergencyContact: d.emergencyContact || undefined,
        salary: d.salary ? Number(d.salary) : undefined,
      }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employee', employee.id] }); onDone() },
  })

  function field(key: keyof typeof form, label: string, type = 'text') {
    return (
      <Input
        label={label}
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {field('firstName', 'First name')}
        {field('lastName', 'Last name')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {field('designation', 'Designation')}
        {field('department', 'Department')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {field('phone', 'Phone')}
        {field('email', 'Email', 'email')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {field('salary', 'Salary', 'number')}
        {field('emergencyContact', 'Emergency contact')}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onDone}><X className="h-4 w-4" />Cancel</Button>
        <Button size="sm" loading={save.isPending} onClick={() => save.mutate(form)}>
          <Check className="h-4 w-4" />Save
        </Button>
      </div>
    </div>
  )
}

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [editing, setEditing] = useState(false)

  const { data: employee, isLoading, isError } = useQuery<Employee>({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/employees/${id}`).then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-6 w-6 text-[#4F46E5]" />
      </div>
    )
  }

  if (isError || !employee) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-gray-500">Employee not found.</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>Go back</Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Employees
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
              {employee.firstName[0]}{employee.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {employee.firstName} {employee.lastName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-gray-500">{employee.employeeId}</span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Briefcase className="h-3.5 w-3.5" />
                  {employee.designation}
                  {employee.department ? ` · ${employee.department}` : ''}
                </span>
                <Badge variant={employee.isActive ? 'success' : 'danger'}>
                  {employee.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />Edit
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {editing ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <EditOverviewForm employee={employee} onDone={() => setEditing(false)} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Employment Details</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <DetailRow label="Designation" value={employee.designation} />
                  <DetailRow label="Department" value={employee.department} />
                  <DetailRow label="Employee ID" value={<span className="font-mono text-xs">{employee.employeeId}</span>} />
                  <DetailRow label="Join date" value={dayjs(employee.joinDate).format('D MMM YYYY')} />
                  <DetailRow label="Status" value={<Badge variant={employee.isActive ? 'success' : 'danger'}>{employee.isActive ? 'Active' : 'Inactive'}</Badge>} />
                  {employee.salary != null && (
                    <DetailRow label="Salary" value={
                      <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5 text-gray-400" />{employee.salary.toLocaleString()}</span>
                    } />
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                    {employee.phone ?? <span className="text-gray-400">—</span>}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                    {employee.email ?? <span className="text-gray-400">—</span>}
                  </div>
                  {employee.emergencyContact && (
                    <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <UserCheck className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Emergency contact</p>
                        {employee.emergencyContact}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance">
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-400">Attendance module coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
