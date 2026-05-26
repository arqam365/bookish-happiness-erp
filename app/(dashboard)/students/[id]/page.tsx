'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, GraduationCap, Phone, Mail, MapPin, Calendar, Droplets, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'

interface Enrollment {
  id: string
  rollNumber: string | null
  isActive: boolean
  class: { id: string; name: string }
  section: { id: string; name: string } | null
  batch: { id: string; name: string } | null
  academicYear: { id: string; name: string }
}

interface Guardian {
  isPrimary: boolean
  guardian: {
    id: string
    firstName: string
    lastName: string
    relationship: string
    phone: string
    email: string | null
    occupation: string | null
    isSponsor: boolean
  }
}

interface Student {
  id: string
  admissionNo: string
  firstName: string
  lastName: string
  gender: string | null
  dateOfBirth: string | null
  religion: string | null
  nationality: string | null
  bloodGroup: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  isActive: boolean
  enrollments: Enrollment[]
  guardians: Guardian[]
}

const GENDERS: Record<string, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' }

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white">{value || '—'}</span>
    </div>
  )
}

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: student, isLoading, isError } = useQuery<Student>({
    queryKey: ['student', id],
    queryFn: () => api.get(`/students/${id}`).then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-6 w-6 text-[#4F46E5]" />
      </div>
    )
  }

  if (isError || !student) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-gray-500">Student not found.</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>Go back</Button>
      </div>
    )
  }

  const activeEnrollment = student.enrollments.find((e) => e.isActive)

  return (
    <div>
      {/* Back + header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Students
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {student.firstName} {student.lastName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-gray-500">{student.admissionNo}</span>
                {activeEnrollment && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {activeEnrollment.class.name}
                      {activeEnrollment.section ? ` · ${activeEnrollment.section.name}` : ''}
                    </span>
                  </>
                )}
                <Badge variant={student.isActive ? 'success' : 'default'}>
                  {student.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="guardians">Guardians</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Personal info */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Personal Information</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DetailRow label="Gender" value={student.gender ? GENDERS[student.gender] : null} />
                <DetailRow label="Date of birth" value={formatDate(student.dateOfBirth)} />
                <DetailRow label="Blood group" value={student.bloodGroup} />
                <DetailRow label="Religion" value={student.religion} />
                <DetailRow label="Nationality" value={student.nationality} />
              </div>
            </div>

            {/* Contact info */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  {student.phone ?? <span className="text-gray-400">—</span>}
                </div>
                <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                  {student.email ?? <span className="text-gray-400">—</span>}
                </div>
                <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <span>
                    {[student.address, student.city].filter(Boolean).join(', ') || <span className="text-gray-400">—</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Enrollment tab */}
        <TabsContent value="enrollment">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            {student.enrollments.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">No enrollment records.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {student.enrollments.map((enr) => (
                  <div key={enr.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {enr.class.name}
                        {enr.section ? ` · ${enr.section.name}` : ''}
                        {enr.batch ? ` · ${enr.batch.name}` : ''}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">{enr.academicYear.name}</p>
                      {enr.rollNumber && (
                        <p className="mt-0.5 text-xs text-gray-400">Roll: {enr.rollNumber}</p>
                      )}
                    </div>
                    <Badge variant={enr.isActive ? 'success' : 'default'}>
                      {enr.isActive ? 'Current' : 'Past'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Guardians tab */}
        <TabsContent value="guardians">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            {student.guardians.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">No guardians linked yet.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {student.guardians.map(({ guardian, isPrimary }) => (
                  <div key={guardian.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {guardian.firstName} {guardian.lastName}
                        </p>
                        {isPrimary && (
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 capitalize">{guardian.relationship}</p>
                      {guardian.occupation && (
                        <p className="text-xs text-gray-400">{guardian.occupation}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500 space-y-0.5">
                      <p>{guardian.phone}</p>
                      {guardian.email && <p>{guardian.email}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Attendance tab */}
        <TabsContent value="attendance">
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-400">Attendance module coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
