'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, CheckCircle2, ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react'
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

interface Course { id: string; name: string; code?: string; description?: string }
interface Batch { id: string; name: string; description?: string }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function IconBtn({ onClick, loading, className, children }: { onClick: () => void; loading?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <Button size="sm" variant="ghost" className={`h-8 w-8 p-0 ${className ?? ''}`} loading={loading} onClick={onClick}>
      {children}
    </Button>
  )
}

function AcademicYears() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ name: '', startDate: '', endDate: '' })

  const { data: years = [], isLoading } = useQuery<AcademicYear[]>({
    queryKey: ['settings-academic-years'],
    queryFn: () => api.get('/settings/academic-years').then((r) => r.data),
  })

  const createYear = useMutation({
    mutationFn: () => api.post('/settings/academic-years', { name, startDate, endDate }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-academic-years'] })
      setShowForm(false); setName(''); setStartDate(''); setEndDate('')
    },
  })

  const activateYear = useMutation({
    mutationFn: (id: string) => api.put(`/settings/academic-years/${id}/activate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-academic-years'] }),
  })

  const updateYear = useMutation({
    mutationFn: (id: string) => api.put(`/settings/academic-years/${id}`, editData).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-academic-years'] })
      setEditingId(null)
    },
  })

  const deleteYear = useMutation({
    mutationFn: (id: string) => api.delete(`/settings/academic-years/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-academic-years'] }),
  })

  function startEdit(year: AcademicYear) {
    setEditingId(year.id)
    setEditData({ name: year.name, startDate: year.startDate.split('T')[0], endDate: year.endDate.split('T')[0] })
  }

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
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input label="Year name" placeholder="2024–2025" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" loading={createYear.isPending} disabled={!name || !startDate || !endDate} onClick={() => createYear.mutate()}>
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : years.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No academic years yet. Add one to get started.</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {years.map((year) => (
            <div key={year.id} className="py-3">
              {editingId === year.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Input label="Year name" value={editData.name} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} />
                    <Input label="Start date" type="date" value={editData.startDate} onChange={(e) => setEditData((d) => ({ ...d, startDate: e.target.value }))} />
                    <Input label="End date" type="date" value={editData.endDate} onChange={(e) => setEditData((d) => ({ ...d, endDate: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" loading={updateYear.isPending} disabled={!editData.name} onClick={() => updateYear.mutate(year.id)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{year.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(year.startDate)} — {formatDate(year.endDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {year.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Button size="sm" variant="ghost" loading={activateYear.isPending} onClick={() => activateYear.mutate(year.id)}>
                        Set active
                      </Button>
                    )}
                    {year.isActive && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    <IconBtn className="text-gray-400 hover:text-gray-700" onClick={() => startEdit(year)}>
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn className="text-gray-400 hover:text-red-600" loading={deleteYear.isPending} onClick={() => deleteYear.mutate(year.id)}>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </div>
              )}
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
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [editClassData, setEditClassData] = useState({ name: '', code: '' })
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editSectionData, setEditSectionData] = useState({ name: '', capacity: '' })

  const { data: classes = [], isLoading } = useQuery<ClassItem[]>({
    queryKey: ['settings-classes'],
    queryFn: () => api.get('/settings/classes').then((r) => r.data),
  })

  const createClass = useMutation({
    mutationFn: () => api.post('/settings/classes', { name: className, code: classCode || undefined }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-classes'] })
      setShowClassForm(false); setClassName(''); setClassCode('')
    },
  })

  const updateClass = useMutation({
    mutationFn: (id: string) => api.put(`/settings/classes/${id}`, { name: editClassData.name, code: editClassData.code || undefined }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-classes'] })
      setEditingClassId(null)
    },
  })

  const deleteClass = useMutation({
    mutationFn: (id: string) => api.delete(`/settings/classes/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-classes'] }),
  })

  const createSection = useMutation({
    mutationFn: ({ classId, name, capacity }: { classId: string; name: string; capacity?: number }) =>
      api.post('/settings/sections', { classId, name, capacity }).then((r) => r.data),
    onSuccess: (_, { classId }) => {
      qc.invalidateQueries({ queryKey: ['settings-classes'] })
      setSectionForms((prev) => ({ ...prev, [classId]: { name: '', capacity: '' } }))
    },
  })

  const updateSection = useMutation({
    mutationFn: (id: string) =>
      api.put(`/settings/sections/${id}`, { name: editSectionData.name, capacity: editSectionData.capacity ? Number(editSectionData.capacity) : undefined }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-classes'] })
      setEditingSectionId(null)
    },
  })

  const deleteSection = useMutation({
    mutationFn: (id: string) => api.delete(`/settings/sections/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-classes'] }),
  })

  function startEditClass(cls: ClassItem) {
    setEditingClassId(cls.id)
    setEditClassData({ name: cls.name, code: cls.code ?? '' })
  }

  function startEditSection(s: Section) {
    setEditingSectionId(s.id)
    setEditSectionData({ name: s.name, capacity: s.capacity ? String(s.capacity) : '' })
  }

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
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Class name" placeholder="Grade 1 / Class 6" value={className} onChange={(e) => setClassName(e.target.value)} />
            <Input label="Code (optional)" placeholder="G1" value={classCode} onChange={(e) => setClassCode(e.target.value)} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" loading={createClass.isPending} disabled={!className} onClick={() => createClass.mutate()}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowClassForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : classes.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No classes yet. Add your first class.</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {classes.map((cls) => {
            const isExpanded = expandedClass === cls.id
            const sectionForm = sectionForms[cls.id] ?? { name: '', capacity: '' }
            return (
              <div key={cls.id}>
                {editingClassId === cls.id ? (
                  <div className="py-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Class name" value={editClassData.name} onChange={(e) => setEditClassData((d) => ({ ...d, name: e.target.value }))} />
                      <Input label="Code (optional)" value={editClassData.code} onChange={(e) => setEditClassData((d) => ({ ...d, code: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" loading={updateClass.isPending} disabled={!editClassData.name} onClick={() => updateClass.mutate(cls.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingClassId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="flex w-full items-center justify-between py-3 text-left"
                    onClick={() => setExpandedClass(isExpanded ? null : cls.id)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{cls.name}</span>
                      {cls.code && <span className="text-xs text-gray-400">({cls.code})</span>}
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs text-gray-400">{cls.sections.length} section{cls.sections.length !== 1 ? 's' : ''}</span>
                      <IconBtn className="text-gray-400 hover:text-gray-700" onClick={() => startEditClass(cls)}>
                        <Pencil className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn className="text-gray-400 hover:text-red-600" loading={deleteClass.isPending} onClick={() => deleteClass.mutate(cls.id)}>
                        <Trash2 className="h-4 w-4" />
                      </IconBtn>
                    </div>
                  </button>
                )}

                {isExpanded && editingClassId !== cls.id && (
                  <div className="pb-3 pl-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {cls.sections.map((s) => (
                        <div key={s.id}>
                          {editingSectionId === s.id ? (
                            <div className="flex items-end gap-2 rounded-lg border border-indigo-100 bg-indigo-50 p-2 dark:border-indigo-800 dark:bg-indigo-950/30">
                              <Input
                                label="Name"
                                className="max-w-[120px]"
                                value={editSectionData.name}
                                onChange={(e) => setEditSectionData((d) => ({ ...d, name: e.target.value }))}
                              />
                              <Input
                                label="Capacity"
                                type="number"
                                className="max-w-[70px]"
                                value={editSectionData.capacity}
                                onChange={(e) => setEditSectionData((d) => ({ ...d, capacity: e.target.value }))}
                              />
                              <Button size="sm" loading={updateSection.isPending} disabled={!editSectionData.name} onClick={() => updateSection.mutate(s.id)} className="mb-[1px]">Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingSectionId(null)} className="mb-[1px]">Cancel</Button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                              {s.name}{s.capacity ? ` (${s.capacity})` : ''}
                              <button
                                className="text-indigo-400 hover:text-indigo-700"
                                onClick={() => startEditSection(s)}
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                className="text-indigo-400 hover:text-red-600"
                                onClick={() => deleteSection.mutate(s.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-end gap-2">
                      <Input
                        label="New section"
                        placeholder="Section A"
                        className="max-w-[140px]"
                        value={sectionForm.name}
                        onChange={(e) => setSectionForms((prev) => ({ ...prev, [cls.id]: { ...sectionForm, name: e.target.value } }))}
                      />
                      <Input
                        label="Capacity"
                        type="number"
                        placeholder="30"
                        className="max-w-[80px]"
                        value={sectionForm.capacity}
                        onChange={(e) => setSectionForms((prev) => ({ ...prev, [cls.id]: { ...sectionForm, capacity: e.target.value } }))}
                      />
                      <Button
                        size="sm"
                        disabled={!sectionForm.name}
                        loading={createSection.isPending}
                        onClick={() => createSection.mutate({ classId: cls.id, name: sectionForm.name, capacity: sectionForm.capacity ? Number(sectionForm.capacity) : undefined })}
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ name: '', code: '' })

  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ['settings-subjects'],
    queryFn: () => api.get('/settings/subjects').then((r) => r.data),
  })

  const createSubject = useMutation({
    mutationFn: () => api.post('/settings/subjects', { name, code: code || undefined }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-subjects'] })
      setShowForm(false); setName(''); setCode('')
    },
  })

  const updateSubject = useMutation({
    mutationFn: (id: string) => api.put(`/settings/subjects/${id}`, { name: editData.name, code: editData.code || undefined }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-subjects'] })
      setEditingId(null)
    },
  })

  const deleteSubject = useMutation({
    mutationFn: (id: string) => api.delete(`/settings/subjects/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-subjects'] }),
  })

  function startEdit(s: Subject) {
    setEditingId(s.id)
    setEditData({ name: s.name, code: s.code ?? '' })
  }

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
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Subject name" placeholder="Mathematics" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Code (optional)" placeholder="MATH" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" loading={createSubject.isPending} disabled={!name} onClick={() => createSubject.mutate()}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : subjects.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No subjects yet.</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {subjects.map((s) => (
            <div key={s.id} className="py-3">
              {editingId === s.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Subject name" value={editData.name} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} />
                    <Input label="Code (optional)" value={editData.code} onChange={(e) => setEditData((d) => ({ ...d, code: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" loading={updateSubject.isPending} disabled={!editData.name} onClick={() => updateSubject.mutate(s.id)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                    {s.code && <p className="text-xs text-gray-500">{s.code}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <IconBtn className="text-gray-400 hover:text-gray-700" onClick={() => startEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn className="text-gray-400 hover:text-red-600" loading={deleteSubject.isPending} onClick={() => deleteSubject.mutate(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function Courses() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ name: '', code: '', description: '' })

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['settings-courses'],
    queryFn: () => api.get('/settings/courses').then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: () => api.post('/settings/courses', { name, code: code || undefined, description: description || undefined }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-courses'] })
      setShowForm(false); setName(''); setCode(''); setDescription('')
    },
  })

  const update = useMutation({
    mutationFn: (id: string) => api.put(`/settings/courses/${id}`, { name: editData.name, code: editData.code || undefined, description: editData.description || undefined }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-courses'] })
      setEditingId(null)
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/settings/courses/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-courses'] }),
  })

  function startEdit(c: Course) {
    setEditingId(c.id)
    setEditData({ name: c.name, code: c.code ?? '', description: c.description ?? '' })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Courses / Programs</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-3.5 w-3.5" />Add course
          </Button>
        </div>
      </CardHeader>

      {showForm && (
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4 space-y-3 dark:border-indigo-800 dark:bg-indigo-950/30">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Course name" placeholder="Science / Alimiyat" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Code (optional)" placeholder="SCI" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" loading={create.isPending} disabled={!name} onClick={() => create.mutate()}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div>
      ) : courses.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No courses yet. Add your first program.</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {courses.map((c) => (
            <div key={c.id} className="py-3">
              {editingId === c.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Course name" value={editData.name} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} />
                    <Input label="Code (optional)" value={editData.code} onChange={(e) => setEditData((d) => ({ ...d, code: e.target.value }))} />
                  </div>
                  <Input label="Description (optional)" value={editData.description} onChange={(e) => setEditData((d) => ({ ...d, description: e.target.value }))} />
                  <div className="flex gap-2">
                    <Button size="sm" loading={update.isPending} disabled={!editData.name} onClick={() => update.mutate(c.id)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {c.name}{c.code ? <span className="ml-2 text-xs text-gray-400">({c.code})</span> : null}
                    </p>
                    {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <IconBtn className="text-gray-400 hover:text-gray-700" onClick={() => startEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn className="text-gray-400 hover:text-red-600" loading={remove.isPending} onClick={() => remove.mutate(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function Batches() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ name: '', description: '' })

  const { data: batches = [], isLoading } = useQuery<Batch[]>({
    queryKey: ['settings-batches'],
    queryFn: () => api.get('/settings/batches').then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: () => api.post('/settings/batches', { name, description: description || undefined }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-batches'] })
      setShowForm(false); setName(''); setDescription('')
    },
  })

  const update = useMutation({
    mutationFn: (id: string) => api.put(`/settings/batches/${id}`, { name: editData.name, description: editData.description || undefined }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-batches'] })
      setEditingId(null)
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/settings/batches/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-batches'] }),
  })

  function startEdit(b: Batch) {
    setEditingId(b.id)
    setEditData({ name: b.name, description: b.description ?? '' })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Batches</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-3.5 w-3.5" />Add batch
          </Button>
        </div>
      </CardHeader>

      {showForm && (
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4 space-y-3 dark:border-indigo-800 dark:bg-indigo-950/30">
          <Input label="Batch name" placeholder="2024 Batch / Morning Batch" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" loading={create.isPending} disabled={!name} onClick={() => create.mutate()}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div>
      ) : batches.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No batches yet.</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {batches.map((b) => (
            <div key={b.id} className="py-3">
              {editingId === b.id ? (
                <div className="space-y-3">
                  <Input label="Batch name" value={editData.name} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} />
                  <Input label="Description (optional)" value={editData.description} onChange={(e) => setEditData((d) => ({ ...d, description: e.target.value }))} />
                  <div className="flex gap-2">
                    <Button size="sm" loading={update.isPending} disabled={!editData.name} onClick={() => update.mutate(b.id)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{b.name}</p>
                    {b.description && <p className="text-xs text-gray-500">{b.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <IconBtn className="text-gray-400 hover:text-gray-700" onClick={() => startEdit(b)}>
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn className="text-gray-400 hover:text-red-600" loading={remove.isPending} onClick={() => remove.mutate(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </div>
              )}
            </div>
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
      <Courses />
      <Batches />
    </div>
  )
}
