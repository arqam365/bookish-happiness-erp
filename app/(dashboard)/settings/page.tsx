'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { GeneralSettings } from './_components/GeneralSettings'
import { AcademicStructure } from './_components/AcademicStructure'
import { RolesSettings } from './_components/RolesSettings'
import { EmailSmsSettings } from './_components/EmailSmsSettings'
import { StudentFields } from './_components/StudentFields'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'academic', label: 'Academic Structure' },
  { id: 'roles', label: 'Roles & Permissions' },
  { id: 'email-sms', label: 'Email & SMS' },
  { id: 'student-fields', label: 'Student Fields' },
] as const

type Tab = (typeof TABS)[number]['id']

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your organization, academic structure, and access control." />

      <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-white p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-[#4F46E5] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && <GeneralSettings />}
      {activeTab === 'academic' && <AcademicStructure />}
      {activeTab === 'roles' && <RolesSettings />}
      {activeTab === 'email-sms' && <EmailSmsSettings />}
      {activeTab === 'student-fields' && <StudentFields />}
    </div>
  )
}
