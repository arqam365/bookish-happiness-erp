'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'

interface AcademicYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

interface Section {
  id: string
  name: string
  capacity?: number
}

interface ClassItem {
  id: string
  name: string
  code?: string
  order?: number
  sections: Section[]
  classSubject: Array<{ subject: { id: string; name: string; code?: string } }>
}

interface Subject {
  id: string
  name: string
  code?: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function AcademicYears() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data: years = [], isLoading } = useQuery<AcademicYear[]>({
    queryKey: ['settings-academic-years'],
    queryFn: () => api.get('/settings/academic-years').then((r) => r.data),
  })

  const createYear = useMutation({
    mutationFn: () => api.post('/settings/academic-years', { name, startDate, endDate }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-academic-years'] })
      setShowForm(false)
      setName('')
      setStartDate('')
      setEndDate('')
    },
  })

  const activateYear = useMutation({
    mutationFn: (id: string) => api.put(`/settings/academic-years/${id}/activate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-academic-years'] }),
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Academic Years</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-3.5 w-3.5" />
            Add year
          </Button>
        </div>
      </CardHeader>

      {showForm && (
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Year name"
              placeholder="2024–2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              loading={createYear.isPending}
              disabled={!name || !startDate || !endDate}
              onClick={() => createYear.mutate()}
            >
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : years.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No academic years yet. Add one to get started.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {years.map((year) => (
            <div key={year.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{year.name}</p>
                <p className="text-xs text-gray-500">
                  {formatDate(year.startDate)} — {formatDate(year.endDate)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {year.isActive ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={activateYear.isPending}
                    onClick={() => activateYear.mutate(year.id)}
                  >
                    Set active
                  </Button>
                )}
                {year.isActive && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function ClassesAndSections() {
  const qc = useQueryClient()
  const [showClassForm, setShowClassForm] = useState(false)
  const [className, setClassName] = useState('')
  const [classCode, setClassCode] = useState('')
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  const [sectionForms, setSectionForms] = useState<Record<string, { name: string; capacity: string }>>({})

  const { data: classes = [], isLoading } = useQuery<ClassItem[]>({
    queryKey: ['settings-classes'],
    queryFn: () => api.get('/settings/classes').then((r) => r.data),
  })

  const createClass = useMutation({
    mutationFn: () => api.post('/settings/classes', { name: className, code: classCode || undefined }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-classes'] })
      setShowClassForm(false)
      setClassName('')
      setClassCode('')
    },
  })

  const createSection = useMutation({
    mutationFn: ({ classId, name, capacity }: { classId: string; name: string; capacity?: number }) =>
      api.post('/settings/sections', { classId, name, capacity }).then((r) => r.data),
    onSuccess: (_, { classId }) => {
      qc.invalidateQueries({ queryKey: ['settings-classes'] })
      setSectionForms((prev) => ({ ...prev, [classId]: { name: '', capacity: '' } }))
    },
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Classes &amp; Sections</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowClassForm((v) => !v)}>
            <Plus className="h-3.5 w-3.5" />
            Add class
          </Button>
        </div>
      </CardHeader>

      {showClassForm && (
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Class name"
              placeholder="Grade 1 / Class 6"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
            <Input
              label="Code (optional)"
              placeholder="G1"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              loading={createClass.isPending}
              disabled={!className}
              onClick={() => createClass.mutate()}
            >
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowClassForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No classes yet. Add your first class.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {classes.map((cls) => {
            const isExpanded = expandedClass === cls.id
            const sectionForm = sectionForms[cls.id] ?? { name: '', capacity: '' }
            return (
              <div key={cls.id}>
                <button
                  className="flex w-full items-center justify-between py-3 text-left"
                  onClick={() => setExpandedClass(isExpanded ? null : cls.id)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-900">{cls.name}</span>
                    {cls.code && <span className="text-xs text-gray-400">({cls.code})</span>}
                  </div>
                  <span className="text-xs text-gray-400">{cls.sections.length} section{cls.sections.length !== 1 ? 's' : ''}</span>
                </button>

                {isExpanded && (
                  <div className="pb-3 pl-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {cls.sections.map((s) => (
                        <span
                          key={s.id}
                          className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                        >
                          {s.name}{s.capacity ? ` (${s.capacity})` : ''}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-end gap-2">
                      <Input
                        label="New section"
                        placeholder="Section A"
                        className="max-w-[140px]"
                        value={sectionForm.name}
                        onChange={(e) =>
                          setSectionForms((prev) => ({
                            ...prev,
                            [cls.id]: { ...sectionForm, name: e.target.value },
                          }))
                        }
                      />
                      <Input
                        label="Capacity"
                        type="number"
                        placeholder="30"
                        className="max-w-[80px]"
                        value={sectionForm.capacity}
                        onChange={(e) =>
                          setSectionForms((prev) => ({
                            ...prev,
                            [cls.id]: { ...sectionForm, capacity: e.target.value },
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        disabled={!sectionForm.name}
                        loading={createSection.isPending}
                        onClick={() =>
                          createSection.mutate({
                            classId: cls.id,
                            name: sectionForm.name,
                            capacity: sectionForm.capacity ? Number(sectionForm.capacity) : undefined,
                          })
                        }
                        className="mb-[1px]"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

function Subjects() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ['settings-subjects'],
    queryFn: () => api.get('/settings/subjects').then((r) => r.data),
  })

  const createSubject = useMutation({
    mutationFn: () =>
      api.post('/settings/subjects', { name, code: code || undefined }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-subjects'] })
      setShowForm(false)
      setName('')
      setCode('')
    },
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Subjects</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-3.5 w-3.5" />
            Add subject
          </Button>
        </div>
      </CardHeader>

      {showForm && (
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Subject name"
              placeholder="Mathematics"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Code (optional)"
              placeholder="MATH"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              loading={createSubject.isPending}
              disabled={!name}
              onClick={() => createSubject.mutate()}
            >
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-gray-100" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No subjects yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <span
              key={s.id}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
            >
              {s.name}{s.code ? ` · ${s.code}` : ''}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}

export function AcademicStructure() {
  return (
    <div className="space-y-6">
      <AcademicYears />
      <ClassesAndSections />
      <Subjects />
    </div>
  )
}
