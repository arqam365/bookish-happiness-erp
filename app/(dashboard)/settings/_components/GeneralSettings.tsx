'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

const orgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  website: z.string().optional(),
})

const settingsSchema = z.object({
  timezone: z.string().optional(),
  language: z.string().optional(),
  currency: z.string().optional(),
  dateFormat: z.string().optional(),
})

type OrgForm = z.infer<typeof orgSchema>
type SettingsForm = z.infer<typeof settingsSchema>

export function GeneralSettings() {
  const qc = useQueryClient()

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['settings-org'],
    queryFn: () => api.get('/settings/organization').then((r) => r.data),
  })

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings-general'],
    queryFn: () => api.get('/settings/general').then((r) => r.data),
  })

  const orgForm = useForm<OrgForm>({ resolver: zodResolver(orgSchema) })
  const settingsForm = useForm<SettingsForm>({ resolver: zodResolver(settingsSchema) })

  useEffect(() => {
    if (org) {
      orgForm.reset({
        name: org.name ?? '',
        address: org.address ?? '',
        phone: org.phone ?? '',
        email: org.email ?? '',
        website: org.website ?? '',
      })
    }
  }, [org])

  useEffect(() => {
    if (settings) {
      settingsForm.reset({
        timezone: settings.timezone ?? '',
        language: settings.language ?? '',
        currency: settings.currency ?? '',
        dateFormat: settings.dateFormat ?? '',
      })
    }
  }, [settings])

  const updateOrg = useMutation({
    mutationFn: (data: OrgForm) => api.put('/settings/organization', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-org'] }),
  })

  const updateSettings = useMutation({
    mutationFn: (data: SettingsForm) => api.put('/settings/general', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-general'] }),
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Profile</CardTitle>
        </CardHeader>
        {orgLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : (
          <form onSubmit={orgForm.handleSubmit((d) => updateOrg.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Organization name"
                error={orgForm.formState.errors.name?.message}
                {...orgForm.register('name')}
              />
              <Input
                label="Phone"
                {...orgForm.register('phone')}
              />
            </div>
            <Input
              label="Email"
              type="email"
              error={orgForm.formState.errors.email?.message}
              {...orgForm.register('email')}
            />
            <Input label="Website" {...orgForm.register('website')} />
            <Input label="Address" {...orgForm.register('address')} />
            <div className="flex justify-end">
              <Button type="submit" loading={updateOrg.isPending}>
                Save organization
              </Button>
            </div>
            {updateOrg.isSuccess && (
              <p className="text-right text-xs text-emerald-600">Saved successfully</p>
            )}
          </form>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
        </CardHeader>
        {settingsLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : (
          <form
            onSubmit={settingsForm.handleSubmit((d) => updateSettings.mutate(d))}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Timezone</label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  {...settingsForm.register('timezone')}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Riyadh">Asia/Riyadh (AST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Language</label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  {...settingsForm.register('language')}
                >
                  <option value="en">English</option>
                  <option value="ur">Urdu</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Currency</label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  {...settingsForm.register('currency')}
                >
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="AED">AED — UAE Dirham</option>
                  <option value="SAR">SAR — Saudi Riyal</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="GBP">GBP — British Pound</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Date format</label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  {...settingsForm.register('dateFormat')}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={updateSettings.isPending}>
                Save settings
              </Button>
            </div>
            {updateSettings.isSuccess && (
              <p className="text-right text-xs text-emerald-600">Saved successfully</p>
            )}
          </form>
        )}
      </Card>
    </div>
  )
}
