'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send } from 'lucide-react'
import dayjs from 'dayjs'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

const SUB_TABS = [
  { id: 'config', label: 'Configuration' },
  { id: 'templates', label: 'Templates' },
  { id: 'history', label: 'Send History' },
  { id: 'credits', label: 'Credits Usage' },
] as const
type SubTab = (typeof SUB_TABS)[number]['id']

// ─── Configuration ────────────────────────────────────────────────────────────
const configSchema = z.object({
  resendApiKey: z.string().optional(),
  twilioSid: z.string().optional(),
  twilioToken: z.string().optional(),
  twilioPhone: z.string().optional(),
})
type ConfigForm = z.infer<typeof configSchema>

function ConfigTab() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['settings-email-sms-config'],
    queryFn: () => api.get('/settings/email-sms/config').then((r) => r.data),
  })

  const form = useForm<ConfigForm>({ resolver: zodResolver(configSchema), values: data ?? {} })

  const save = useMutation({
    mutationFn: (d: ConfigForm) => api.put('/settings/email-sms/config', d).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-email-sms-config'] }),
  })

  const testEmail = useMutation({
    mutationFn: () => api.post('/settings/email-sms/test-email').then((r) => r.data),
  })

  const testSms = useMutation({
    mutationFn: () => api.post('/settings/email-sms/test-sms').then((r) => r.data),
  })

  if (isLoading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div>

  return (
    <form onSubmit={form.handleSubmit((d) => save.mutate(d))} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email — Resend</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <Input label="Resend API Key" type="password" placeholder="re_..." {...form.register('resendApiKey')} />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">Used for transactional emails (fee reminders, results, welcome).</p>
            <Button type="button" variant="ghost" size="sm" loading={testEmail.isPending} onClick={() => testEmail.mutate()}>
              <Send className="h-3.5 w-3.5" />Test send
            </Button>
          </div>
          {testEmail.isSuccess && <p className="text-xs text-emerald-600">Test email sent.</p>}
          {testEmail.isError && <p className="text-xs text-rose-500">Failed to send test email.</p>}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMS — Twilio</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Account SID" type="password" placeholder="AC..." {...form.register('twilioSid')} />
            <Input label="Auth Token" type="password" {...form.register('twilioToken')} />
          </div>
          <Input label="From Phone Number" placeholder="+1234567890" {...form.register('twilioPhone')} />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">Used for attendance absent alerts and fee due reminders.</p>
            <Button type="button" variant="ghost" size="sm" loading={testSms.isPending} onClick={() => testSms.mutate()}>
              <Send className="h-3.5 w-3.5" />Test SMS
            </Button>
          </div>
          {testSms.isSuccess && <p className="text-xs text-emerald-600">Test SMS sent.</p>}
          {testSms.isError && <p className="text-xs text-rose-500">Failed to send test SMS.</p>}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={save.isPending}>Save configuration</Button>
      </div>
      {save.isSuccess && <p className="text-right text-xs text-emerald-600">Saved successfully</p>}
    </form>
  )
}

// ─── Templates ────────────────────────────────────────────────────────────────
const TRIGGERS = [
  { key: 'attendance_absent_sms', label: 'Attendance Absent', channel: 'SMS' },
  { key: 'attendance_absent_email', label: 'Attendance Absent', channel: 'Email' },
  { key: 'fee_due_reminder_sms', label: 'Fee Due Reminder', channel: 'SMS' },
  { key: 'fee_due_reminder_email', label: 'Fee Due Reminder', channel: 'Email' },
  { key: 'exam_result_email', label: 'Exam Result Published', channel: 'Email' },
  { key: 'welcome_email', label: 'Welcome (New Enrollment)', channel: 'Email' },
  { key: 'announcement_sms', label: 'Custom Announcement', channel: 'SMS' },
  { key: 'announcement_email', label: 'Custom Announcement', channel: 'Email' },
] as const

interface Template { key: string; subject: string; body: string; enabled: boolean }

function TemplatesTab() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<string | null>(null)

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['settings-email-sms-templates'],
    queryFn: () => api.get('/settings/email-sms/templates').then((r) => r.data),
  })

  const save = useMutation({
    mutationFn: ({ key, ...body }: { key: string; subject: string; body: string; enabled: boolean }) =>
      api.put(`/settings/email-sms/templates/${key}`, body).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-email-sms-templates'] }); setEditing(null) },
  })

  const getTemplate = (key: string) => templates.find((t) => t.key === key)

  if (isLoading) return <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div>

  return (
    <div className="space-y-3">
      {TRIGGERS.map((trigger) => {
        const tpl = getTemplate(trigger.key)
        const isOpen = editing === trigger.key

        return (
          <Card key={trigger.key}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={trigger.channel === 'SMS' ? 'warning' : 'default'}>{trigger.channel}</Badge>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{trigger.label}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditing(isOpen ? null : trigger.key)}>
                {isOpen ? 'Close' : 'Edit'}
              </Button>
            </div>

            {isOpen && (
              <TemplateEditor
                templateKey={trigger.key}
                initial={tpl}
                channel={trigger.channel}
                onSave={(d) => save.mutate({ key: trigger.key, ...d })}
                saving={save.isPending}
              />
            )}
          </Card>
        )
      })}
    </div>
  )
}

function TemplateEditor({
  templateKey, initial, channel, onSave, saving,
}: {
  templateKey: string
  initial?: Template
  channel: string
  onSave: (d: { subject: string; body: string; enabled: boolean }) => void
  saving: boolean
}) {
  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [enabled, setEnabled] = useState(initial?.enabled ?? true)

  return (
    <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <input type="checkbox" id={`enabled-${templateKey}`} checked={enabled} onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5]" />
        <label htmlFor={`enabled-${templateKey}`} className="text-sm text-gray-700 dark:text-gray-200">Enabled</label>
      </div>
      {channel === 'Email' && (
        <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {channel === 'SMS' ? 'Message' : 'Body'}{' '}
          <span className="font-normal text-gray-400">(use {'{{name}}'}, {'{{amount}}'}, {'{{date}}'} as variables)</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <div className="flex justify-end">
        <Button size="sm" loading={saving} onClick={() => onSave({ subject, body, enabled })}>Save template</Button>
      </div>
    </div>
  )
}

// ─── Send History ─────────────────────────────────────────────────────────────
interface SendLog {
  id: string
  to: string
  type: string
  channel: string
  status: 'delivered' | 'failed' | 'pending'
  sentAt: string
}

function SendHistoryTab() {
  const { data = [], isLoading } = useQuery<SendLog[]>({
    queryKey: ['settings-email-sms-history'],
    queryFn: () => api.get('/settings/email-sms/history').then((r) => r.data),
  })

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">To</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Type</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Channel</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Sent At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(5)].map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></td>
                ))}</tr>
              ))
            ) : data.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">No messages sent yet.</td></tr>
            ) : (
              data.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{log.to}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{log.type}</td>
                  <td className="px-4 py-3">
                    <Badge variant={log.channel === 'SMS' ? 'warning' : 'default'}>{log.channel}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={log.status === 'delivered' ? 'success' : log.status === 'failed' ? 'danger' : 'default'}>
                      {log.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{dayjs(log.sentAt).format('D MMM YY, h:mm A')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Credits Usage ────────────────────────────────────────────────────────────
function CreditsTab() {
  const { data, isLoading } = useQuery<{ smsUsed: number; smsLimit: number; emailUsed: number; emailLimit: number }>({
    queryKey: ['settings-email-sms-credits'],
    queryFn: () => api.get('/settings/email-sms/credits').then((r) => r.data),
  })

  function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
    const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
    const color = pct > 90 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
    return (
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {used.toLocaleString()} / {limit.toLocaleString()}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-400">{Math.round(pct)}% used</p>
        </div>
      </Card>
    )
  }

  if (isLoading) return <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}</div>
  if (!data) return null

  return (
    <div className="space-y-4">
      <UsageBar used={data.smsUsed} limit={data.smsLimit} label="SMS Messages" />
      <UsageBar used={data.emailUsed} limit={data.emailLimit} label="Emails" />
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function EmailSmsSettings() {
  const [activeTab, setActiveTab] = useState<SubTab>('config')

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 w-fit dark:border-gray-700 dark:bg-gray-900">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-[#4F46E5] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'config' && <ConfigTab />}
      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'history' && <SendHistoryTab />}
      {activeTab === 'credits' && <CreditsTab />}
    </div>
  )
}
