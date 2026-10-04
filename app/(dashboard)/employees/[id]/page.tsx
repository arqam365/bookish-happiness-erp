'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, UserCheck, Phone, Mail, Briefcase, DollarSign, Pencil, X, Check, ShieldCheck, BookOpen, Trash2, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Select, SelectItem } from '@/components/ui/select'
import api from '@/lib/api'
import dayjs from 'dayjs'

type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED'

interface Permission {
  id: string
  module: string
  action: string
  description?: string
}

interface Role {
  id: string
  name: string
  description?: string
  isSystem?: boolean
  rolePermissions: Array<{ permission: Permission }>
}

interface SectionAssignment {
  id: string
  section: { id: string; name: string; class: { id: string; name: string } }
}

interface ClassItem {
  id: string
  name: string
  sections: Array<{ id: string; name: string }>
}

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
  address: string | null
  teacherIdNo: string | null
  joinDate: string
  isActive: boolean
  status: EmployeeStatus
  roleId?: string | null
  role?: Role | null
}

const STATUS_CONFIG: Record<EmployeeStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  ACTIVE:     { label: 'Active',     variant: 'success'  },
  ON_LEAVE:   { label: 'On Leave',   variant: 'warning'  },
  RESIGNED:   { label: 'Resigned',   variant: 'danger'   },
  TERMINATED: { label: 'Terminated', variant: 'danger'   },
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
    teacherIdNo: employee.teacherIdNo ?? '',
    address: employee.address ?? '',
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
      <Input label={label} type={type} value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
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
      <div className="grid grid-cols-2 gap-3">
        {field('teacherIdNo', 'Teacher ID No.')}
        {field('address', 'Address')}
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

function RoleTab({ employee }: { employee: Employee }) {
  const qc = useQueryClient()
  const [selectedRoleId, setSelectedRoleId] = useState(employee.roleId ?? '')

  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: ['settings-roles'],
    queryFn: () => api.get('/settings/roles').then((r) => r.data),
  })

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/employees/${employee.id}`, { roleId: selectedRoleId || null }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee', employee.id] }),
  })

  const isDirty = selectedRoleId !== (employee.roleId ?? '')
  const currentRole = roles.find((r) => r.id === selectedRoleId)
  const perms = currentRole?.rolePermissions.map((rp) => rp.permission) ?? []
  const grouped = perms.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = []
    acc[p.module].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Assigned Role</h3>
            <p className="mt-0.5 text-xs text-gray-500">Controls what this employee can access in the system.</p>
          </div>
          {isDirty && (
            <Button size="sm" loading={save.isPending} onClick={() => save.mutate()}>
              <Check className="h-3.5 w-3.5" />Save
            </Button>
          )}
        </div>
        {isLoading ? (
          <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        ) : (
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId} placeholder="No role assigned">
            <SelectItem value="">No role</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.name}{r.description ? ` — ${r.description}` : ''}</SelectItem>
            ))}
          </Select>
        )}
      </div>

      {currentRole && perms.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Permissions
            <span className="ml-2 text-xs font-normal text-gray-400">({perms.length} total)</span>
          </h3>
          <div className="space-y-4">
            {Object.entries(grouped).map(([module, modulePerms]) => (
              <div key={module}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{module}</p>
                <div className="flex flex-wrap gap-1.5">
                  {modulePerms.map((p) => (
                    <span key={p.id} className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {p.action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentRole && perms.length === 0 && (
        <p className="py-4 text-center text-sm text-gray-400">This role has no permissions assigned.</p>
      )}

      {!selectedRoleId && (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-400">No role assigned — select one above to see permissions.</p>
        </div>
      )}
    </div>
  )
}

function AssignmentsTab({ employee }: { employee: Employee }) {
  const qc = useQueryClient()
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')

  const { data: classes = [] } = useQuery<ClassItem[]>({
    queryKey: ['settings-classes'],
    queryFn: () => api.get('/settings/classes').then((r) => r.data),
  })

  const { data: assignments = [], isLoading } = useQuery<SectionAssignment[]>({
    queryKey: ['employee-sections', employee.id],
    queryFn: () => api.get(`/employees/${employee.id}/sections`).then((r) => r.data),
  })

  const assign = useMutation({
    mutationFn: (sid: string) =>
      api.post(`/employees/${employee.id}/sections`, { sectionId: sid }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee-sections', employee.id] })
      setClassId('')
      setSectionId('')
    },
  })

  const unassign = useMutation({
    mutationFn: (sid: string) =>
      api.delete(`/employees/${employee.id}/sections/${sid}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-sections', employee.id] }),
  })

  const selectedClass = classes.find((c) => c.id === classId)
  const assignedSectionIds = new Set(assignments.map((a) => a.section.id))
  const availableSections = selectedClass?.sections.filter((s) => !assignedSectionIds.has(s.id)) ?? []

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Assign to Class / Section</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <Select label="Class" value={classId} onValueChange={(v) => { setClassId(v); setSectionId('') }} placeholder="Select class">
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </Select>
          </div>
          {selectedClass && availableSections.length > 0 && (
            <div className="min-w-[160px]">
              <Select label="Section" value={sectionId} onValueChange={setSectionId} placeholder="Select section">
                {availableSections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </Select>
            </div>
          )}
          {selectedClass && availableSections.length === 0 && (
            <p className="pb-1 text-xs text-gray-400">All sections in this class already assigned.</p>
          )}
          <div className="pb-0.5">
            <Button size="sm" disabled={!sectionId} loading={assign.isPending} onClick={() => assign.mutate(sectionId)}>
              <Plus className="h-3.5 w-3.5" />Assign
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Teaching Assignments
            <span className="ml-2 text-xs font-normal text-gray-400">({assignments.length})</span>
          </h3>
        </div>
        {isLoading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="h-4 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-7 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-gray-400">No sections assigned yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {a.section.class.name} — {a.section.name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-rose-500"
                  onClick={() => unassign.mutate(a.section.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)

  const { data: employee, isLoading, isError } = useQuery<Employee>({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/employees/${id}`).then((r) => r.data),
  })

  const toggleActive = useMutation({
    mutationFn: () =>
      api.patch(`/employees/${employee!.id}`, { isActive: !employee!.isActive }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee', id] }),
  })

  const changeStatus = useMutation({
    mutationFn: (status: EmployeeStatus) =>
      api.patch(`/employees/${employee!.id}`, { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee', id] }),
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

  const statusCfg = STATUS_CONFIG[employee.status] ?? { label: employee.status, variant: 'default' as const }

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
                <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                {!employee.isActive && <Badge variant="danger">Inactive</Badge>}
              </div>
            </div>
          </div>

          {!editing && (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={employee.status}
                onValueChange={(v) => changeStatus.mutate(v as EmployeeStatus)}
                placeholder="Status"
              >
                {(Object.keys(STATUS_CONFIG) as EmployeeStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                ))}
              </Select>
              <Button variant="outline" size="sm" loading={toggleActive.isPending} onClick={() => toggleActive.mutate()}>
                {employee.isActive ? 'Deactivate' : 'Activate'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" />Edit
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="role">
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />Role &amp; Permissions
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <BookOpen className="mr-1 h-3.5 w-3.5" />Assignments
          </TabsTrigger>
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
                  <DetailRow label="Status" value={<Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>} />
                  {employee.teacherIdNo && (
                    <DetailRow label="Teacher ID No." value={<span className="font-mono text-xs">{employee.teacherIdNo}</span>} />
                  )}
                  {employee.salary != null && (
                    <DetailRow label="Salary" value={
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-gray-400" />{employee.salary.toLocaleString()}
                      </span>
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
                  {employee.address && (
                    <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <Mail className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Address</p>
                        {employee.address}
                      </div>
                    </div>
                  )}
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

              {employee.role && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 dark:border-indigo-900 dark:bg-indigo-950/20 md:col-span-2">
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-500" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Role: {employee.role.name}
                    </h3>
                    {employee.role.description && (
                      <span className="text-xs text-gray-500">{employee.role.description}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {employee.role.rolePermissions.slice(0, 12).map((rp) => (
                      <span key={rp.permission.id} className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                        {rp.permission.module}:{rp.permission.action}
                      </span>
                    ))}
                    {employee.role.rolePermissions.length > 12 && (
                      <span className="text-xs text-gray-400">+{employee.role.rolePermissions.length - 12} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="role">
          <RoleTab employee={employee} />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentsTab employee={employee} />
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
