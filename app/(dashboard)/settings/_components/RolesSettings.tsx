'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'

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

function groupByModule(permissions: Permission[]) {
  return permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = []
    acc[p.module].push(p)
    return acc
  }, {})
}

export function RolesSettings() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [roleDesc, setRoleDesc] = useState('')
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([])
  const [expandedRole, setExpandedRole] = useState<string | null>(null)

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['settings-roles'],
    queryFn: () => api.get('/settings/roles').then((r) => r.data),
  })

  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ['settings-permissions'],
    queryFn: () => api.get('/settings/permissions').then((r) => r.data),
    enabled: showForm,
  })

  const createRole = useMutation({
    mutationFn: () =>
      api
        .post('/settings/roles', {
          name: roleName,
          description: roleDesc || undefined,
          permissionIds: selectedPermIds,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-roles'] })
      setShowForm(false)
      setRoleName('')
      setRoleDesc('')
      setSelectedPermIds([])
    },
  })

  const grouped = groupByModule(permissions)

  const togglePerm = (id: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const toggleModule = (module: string) => {
    const ids = grouped[module].map((p) => p.id)
    const allSelected = ids.every((id) => selectedPermIds.includes(id))
    if (allSelected) {
      setSelectedPermIds((prev) => prev.filter((id) => !ids.includes(id)))
    } else {
      setSelectedPermIds((prev) => [...new Set([...prev, ...ids])])
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Roles &amp; Permissions</CardTitle>
              <p className="mt-1 text-xs text-gray-500">
                Define what each role can access within your organization.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-3.5 w-3.5" />
              New role
            </Button>
          </div>
        </CardHeader>

        {showForm && (
          <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <h4 className="mb-4 text-sm font-semibold text-gray-900">Create new role</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4">
              <Input
                label="Role name"
                placeholder="Class Teacher"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
              <Input
                label="Description (optional)"
                placeholder="Can view students and attendance"
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
              />
            </div>

            <p className="mb-3 text-sm font-medium text-gray-700">Select permissions</p>
            <div className="space-y-3 max-h-72 overflow-y-auto rounded-lg border border-indigo-200 bg-white p-3">
              {Object.entries(grouped).map(([module, perms]) => {
                const ids = perms.map((p) => p.id)
                const allSelected = ids.every((id) => selectedPermIds.includes(id))
                const someSelected = ids.some((id) => selectedPermIds.includes(id))
                return (
                  <div key={module}>
                    <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = !allSelected && someSelected
                        }}
                        onChange={() => toggleModule(module)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {module}
                      </span>
                    </label>
                    <div className="pl-6 grid grid-cols-2 gap-1 sm:grid-cols-3">
                      {perms.map((p) => (
                        <label key={p.id} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPermIds.includes(p.id)}
                            onChange={() => togglePerm(p.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-600">{p.action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                loading={createRole.isPending}
                disabled={!roleName}
                onClick={() => createRole.mutate()}
              >
                Create role
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {rolesLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : roles.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No roles defined.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {roles.map((role) => {
              const isExpanded = expandedRole === role.id
              const perms = role.rolePermissions.map((rp) => rp.permission)
              return (
                <div key={role.id}>
                  <button
                    className="flex w-full items-start justify-between py-3 text-left"
                    onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{role.name}</span>
                          {role.isSystem && <Badge variant="info">System</Badge>}
                        </div>
                        {role.description && (
                          <p className="text-xs text-gray-500">{role.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 mt-0.5 shrink-0">
                      {perms.length} permission{perms.length !== 1 ? 's' : ''}
                    </span>
                  </button>

                  {isExpanded && perms.length > 0 && (
                    <div className="pb-3 pl-6">
                      <div className="flex flex-wrap gap-1.5">
                        {perms.map((p) => (
                          <span
                            key={p.id}
                            className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600"
                          >
                            {p.module}:{p.action}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
