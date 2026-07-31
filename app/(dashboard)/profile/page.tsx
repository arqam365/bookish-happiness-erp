'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { User, Mail, Phone, Building2, Shield, Pencil, X, Check } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'

export default function ProfilePage() {
  const { user, setAuth, permissions, accessToken } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: '',
  })

  const save = useMutation({
    mutationFn: (d: typeof form) => api.patch('/auth/me', d).then((r) => r.data),
    onSuccess: (updated) => {
      if (user && accessToken) {
        setAuth({ user: { ...user, firstName: updated.firstName, lastName: updated.lastName }, permissions, accessToken })
      }
      setEditing(false)
    },
  })

  function startEdit() {
    setForm({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: '' })
    setEditing(true)
  }

  if (!user) return null

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()

  return (
    <div className="max-w-2xl">
      <PageHeader title="My Profile" subtitle="View and update your account details." />

      <div className="space-y-6">
        {/* Avatar + name card */}
        <div className="flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            {user.organization?.name && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                <Building2 className="h-3.5 w-3.5" />
                {user.organization.name}
              </p>
            )}
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Pencil className="h-4 w-4" />Edit
            </Button>
          )}
        </div>

        {/* Edit form */}
        {editing && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Edit Profile</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First name"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
                <Input
                  label="Last name"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
              <Input
                label="Phone (optional)"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4" />Cancel
                </Button>
                <Button size="sm" loading={save.isPending} onClick={() => save.mutate(form)}>
                  <Check className="h-4 w-4" />Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Account info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Account</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <Mail className="h-4 w-4 shrink-0 text-gray-400" />
              {user.email}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <User className="h-4 w-4 shrink-0 text-gray-400" />
              {user.isSuperAdmin ? 'Super Admin' : 'Staff'}
            </div>
            {user.organization && (
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
                {user.organization.name}
                <Badge variant="default" className="text-xs">{user.organization.type}</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Permissions */}
        {permissions.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Shield className="h-4 w-4 text-indigo-500" />
              Permissions
            </h3>
            <div className="flex flex-wrap gap-2">
              {permissions.map((p) => (
                <span key={p} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
