'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Plus, ClipboardList, Trophy, CheckCircle, PenLine, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Select, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import api from '@/lib/api'

// ── Interfaces ────────────────────────────────────────────────────────────────

interface AcademicYear { id: string; name: string; isActive: boolean }
interface ExamType { id: string; name: string }
interface Subject { id: string; name: string; code: string | null }
interface ClassItem { id: string; name: string; code: string | null }

interface Exam {
  id: string
  name: string
  startDate: string
  endDate: string
  totalMarks: number | null
  passingMarks: number | null
  status: string
  academicYear: { name: string }
  examType?: { name: string } | null
}

interface ExamComponentData {
  id: string; name: string; type: string; category: string
  maxMarks: number; passingMarks?: number | null; weightPercent?: number | null
}
interface ExamSubjectData {
  id: string; subjectId: string
  subject: { id: string; name: string; code: string | null }
  components: ExamComponentData[]
}
interface ExamClassData {
  id: string; classId: string
  class: { id: string; name: string; code: string | null }
  examSubjects: ExamSubjectData[]
}
interface ExamConfig extends Exam {
  examClasses: ExamClassData[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const COMPONENT_TYPES = [
  { value: 'WRITTEN', label: 'Written' },
  { value: 'ORAL', label: 'Oral' },
  { value: 'PRACTICAL', label: 'Practical' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'CUSTOM', label: 'Custom' },
]
const COMPONENT_CATEGORIES = [
  { value: 'INTERNAL', label: 'Internal' },
  { value: 'EXTERNAL', label: 'External' },
]

// ── Create Exam Modal ─────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1, 'Required'),
  academicYearId: z.string().min(1, 'Required'),
  examTypeId: z.string().optional(),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
})
type CreateForm = z.infer<typeof createSchema>

function CreateExamModal({ onCreated }: { onCreated?: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<CreateForm>({ resolver: zodResolver(createSchema) as any })

  const { data: years = [] } = useQuery<AcademicYear[]>({
    queryKey: ['settings-academic-years'],
    queryFn: () => api.get('/settings/academic-years').then((r) => r.data),
    enabled: open,
  })

  const { data: examTypes = [] } = useQuery<ExamType[]>({
    queryKey: ['exam-types'],
    queryFn: () => api.get('/settings/exam-types').then((r) => r.data),
    enabled: open,
  })

  const create = useMutation({
    mutationFn: (data: CreateForm) => api.post('/exams', data).then((r) => r.data),
    onSuccess: (exam) => {
      qc.invalidateQueries({ queryKey: ['exams'] })
      setOpen(false)
      form.reset()
      onCreated?.(exam.id)
    },
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset() }}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" />Create exam</Button>
      </DialogTrigger>
      <DialogContent title="Create exam" description="Set up a new examination.">
        <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-2">
            <Input label="Exam name *" placeholder="Midterm 2025" error={form.formState.errors.name?.message} {...form.register('name')} />

            <div className="grid grid-cols-2 gap-3">
              <Select label="Academic year *" value={form.watch('academicYearId') ?? ''} onValueChange={(v) => form.setValue('academicYearId', v)} placeholder="Select" error={form.formState.errors.academicYearId?.message}>
                {years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}{y.isActive ? ' (Active)' : ''}</SelectItem>)}
              </Select>
              <Select label="Exam type" value={form.watch('examTypeId') ?? ''} onValueChange={(v) => form.setValue('examTypeId', v)} placeholder="Optional">
                {examTypes.length === 0
                  ? <SelectItem value="__none__">No types configured</SelectItem>
                  : examTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)
                }
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Start date *" type="date" error={form.formState.errors.startDate?.message} {...form.register('startDate')} />
              <Input label="End date *" type="date" error={form.formState.errors.endDate?.message} {...form.register('endDate')} />
            </div>
          </div>
          <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2 pt-3">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancel</Button></DialogClose>
            <Button type="submit" size="sm" loading={create.isPending}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Marks Entry Modal ─────────────────────────────────────────────────────────

interface Student { id: string; firstName: string; lastName: string; admissionNo: string }

function MarksEntryModal({ exam }: { exam: Exam }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [marksMap, setMarksMap] = useState<Record<string, string>>({})

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['settings-subjects'],
    queryFn: () => api.get('/settings/subjects').then((r) => r.data),
    enabled: open,
  })

  const { data: studentsRes } = useQuery<{ data: Student[] }>({
    queryKey: ['students-all'],
    queryFn: () => api.get('/students', { params: { limit: 200 } }).then((r) => r.data),
    enabled: open,
  })
  const students = studentsRes?.data ?? []

  const submit = useMutation({
    mutationFn: () => {
      const entries = students
        .filter((s) => marksMap[s.id] !== undefined && marksMap[s.id] !== '')
        .map((s) => ({ studentId: s.id, subjectId: selectedSubjectId, marksObtained: Number(marksMap[s.id]) }))
      return api.post(`/exams/${exam.id}/marks`, { entries }).then((r) => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam-ranking', exam.id] })
      setOpen(false)
      setMarksMap({})
      setSelectedSubjectId('')
    },
  })

  const handleClose = (v: boolean) => {
    setOpen(v)
    if (!v) { setMarksMap({}); setSelectedSubjectId('') }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><PenLine className="h-4 w-4" />Enter marks</Button>
      </DialogTrigger>
      <DialogContent title="Enter marks" description={`Enter student marks for ${exam.name}`}>
        <div className="space-y-4">
          <Select
            label="Subject *"
            value={selectedSubjectId}
            onValueChange={setSelectedSubjectId}
            placeholder="Select subject"
          >
            {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</SelectItem>)}
          </Select>

          {selectedSubjectId && (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Student</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Adm. No</th>
                    <th className="w-28 px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Marks{exam.totalMarks ? ` / ${exam.totalMarks}` : ''}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {students.length === 0 ? (
                    <tr><td colSpan={3} className="px-3 py-4 text-center text-xs text-gray-400">No students found.</td></tr>
                  ) : students.map((s) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{s.firstName} {s.lastName}</td>
                      <td className="px-3 py-2 text-xs text-gray-400">{s.admissionNo}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max={exam.totalMarks ?? undefined}
                          value={marksMap[s.id] ?? ''}
                          onChange={(e) => setMarksMap((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#4F46E5] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancel</Button></DialogClose>
            <Button
              size="sm"
              disabled={!selectedSubjectId || Object.values(marksMap).every((v) => v === '')}
              loading={submit.isPending}
              onClick={() => submit.mutate()}
            >
              Save marks
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Exam Structure Tab ────────────────────────────────────────────────────────

function AddComponentForm({ examId, examSubjectId, onDone }: { examId: string; examSubjectId: string; onDone: () => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [type, setType] = useState('WRITTEN')
  const [category, setCategory] = useState('EXTERNAL')
  const [maxMarks, setMaxMarks] = useState('')
  const [passingMarks, setPassingMarks] = useState('')
  const [weightPercent, setWeightPercent] = useState('')

  const add = useMutation({
    mutationFn: () => api.post(`/exams/${examId}/subjects/${examSubjectId}/components`, {
      name, type, category,
      maxMarks: Number(maxMarks),
      passingMarks: passingMarks ? Number(passingMarks) : null,
      weightPercent: weightPercent ? Number(weightPercent) : null,
    }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam-config'] })
      onDone()
    },
  })

  return (
    <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-900/40 dark:bg-indigo-900/10 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Theory Paper"
        />
        <Input
          label="Max marks *"
          type="number"
          value={maxMarks}
          onChange={(e) => setMaxMarks(e.target.value)}
          placeholder="100"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select label="Type" value={type} onValueChange={setType}>
          {COMPONENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
        </Select>
        <Select label="Category" value={category} onValueChange={setCategory}>
          {COMPONENT_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Passing marks"
          type="number"
          value={passingMarks}
          onChange={(e) => setPassingMarks(e.target.value)}
          placeholder="Optional"
        />
        <Input
          label="Weight %"
          type="number"
          value={weightPercent}
          onChange={(e) => setWeightPercent(e.target.value)}
          placeholder="Optional"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
        <Button
          size="sm"
          loading={add.isPending}
          disabled={!name || !maxMarks}
          onClick={() => add.mutate()}
        >
          Add
        </Button>
      </div>
    </div>
  )
}

function ExamSubjectRow({
  examId, examSubject,
}: {
  examId: string
  examSubject: ExamSubjectData
}) {
  const qc = useQueryClient()
  const [addingComponent, setAddingComponent] = useState(false)

  const removeSubject = useMutation({
    mutationFn: () => api.delete(`/exams/${examId}/subjects/${examSubject.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exam-config', examId] }),
  })

  const removeComponent = useMutation({
    mutationFn: (componentId: string) => api.delete(`/exams/${examId}/components/${componentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exam-config', examId] }),
  })

  return (
    <div className="ml-4 mt-2 rounded-lg border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-900/50">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {examSubject.subject.name}
          {examSubject.subject.code && <span className="ml-1 text-xs text-gray-400">({examSubject.subject.code})</span>}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
          loading={removeSubject.isPending}
          onClick={() => removeSubject.mutate()}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {examSubject.components.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {examSubject.components.map((comp) => (
            <div key={comp.id} className="flex items-center gap-3 px-3 py-1.5">
              <span className="flex-1 text-xs text-gray-700 dark:text-gray-300">{comp.name}</span>
              <Badge variant="default" className="text-xs">{COMPONENT_TYPES.find((t) => t.value === comp.type)?.label ?? comp.type}</Badge>
              <Badge variant="default" className="text-xs">{COMPONENT_CATEGORIES.find((c) => c.value === comp.category)?.label ?? comp.category}</Badge>
              <span className="text-xs text-gray-500">{comp.maxMarks} marks</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
                loading={removeComponent.isPending}
                onClick={() => removeComponent.mutate(comp.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="px-3 pb-2 pt-1">
        {addingComponent ? (
          <AddComponentForm
            examId={examId}
            examSubjectId={examSubject.id}
            onDone={() => { setAddingComponent(false); qc.invalidateQueries({ queryKey: ['exam-config', examId] }) }}
          />
        ) : (
          <button
            onClick={() => setAddingComponent(true)}
            className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
          >
            + Add component
          </button>
        )}
      </div>
    </div>
  )
}

function ExamClassCard({
  examId, examClass,
}: {
  examId: string
  examClass: ExamClassData
}) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(true)
  const [addingSubject, setAddingSubject] = useState(false)
  const [subjectId, setSubjectId] = useState('')

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['settings-subjects'],
    queryFn: () => api.get('/settings/subjects').then((r) => r.data),
    enabled: addingSubject,
  })

  const removeClass = useMutation({
    mutationFn: () => api.delete(`/exams/${examId}/classes/${examClass.classId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exam-config', examId] }),
  })

  const addSubject = useMutation({
    mutationFn: () => api.post(`/exams/${examId}/classes/${examClass.id}/subjects`, { subjectId }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam-config', examId] })
      setAddingSubject(false)
      setSubjectId('')
    },
  })

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {examClass.class.name}
          {examClass.class.code && <span className="text-xs font-normal text-gray-400">({examClass.class.code})</span>}
          <Badge variant="default" className="ml-1">{examClass.examSubjects.length} subjects</Badge>
        </button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
          loading={removeClass.isPending}
          onClick={() => removeClass.mutate()}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {expanded && (
        <div className="px-4 pb-3 space-y-1">
          {examClass.examSubjects.map((es) => (
            <ExamSubjectRow key={es.id} examId={examId} examSubject={es} />
          ))}

          {addingSubject ? (
            <div className="ml-4 mt-2 flex items-end gap-2">
              <div className="flex-1">
                <Select label="Subject" value={subjectId} onValueChange={setSubjectId} placeholder="Select subject">
                  {subjects
                    .filter((s) => !examClass.examSubjects.some((es) => es.subjectId === s.id))
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</SelectItem>
                    ))}
                </Select>
              </div>
              <Button size="sm" loading={addSubject.isPending} disabled={!subjectId} onClick={() => addSubject.mutate()}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingSubject(false); setSubjectId('') }}>Cancel</Button>
            </div>
          ) : (
            <button
              className="ml-4 mt-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
              onClick={() => setAddingSubject(true)}
            >
              + Add subject
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ExamStructureTab({ examId }: { examId: string }) {
  const qc = useQueryClient()
  const [addingClass, setAddingClass] = useState(false)
  const [classId, setClassId] = useState('')

  const { data: config, isLoading } = useQuery<ExamConfig>({
    queryKey: ['exam-config', examId],
    queryFn: () => api.get(`/exams/${examId}/config`).then((r) => r.data),
  })

  const { data: classes = [] } = useQuery<ClassItem[]>({
    queryKey: ['settings-classes'],
    queryFn: () => api.get('/settings/classes').then((r) => r.data),
    enabled: addingClass,
  })

  const addClass = useMutation({
    mutationFn: () => api.post(`/exams/${examId}/classes`, { classId }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam-config', examId] })
      setAddingClass(false)
      setClassId('')
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
        ))}
      </div>
    )
  }

  const examClasses = config?.examClasses ?? []

  return (
    <div className="space-y-3">
      {examClasses.length === 0 && !addingClass && (
        <p className="py-6 text-center text-sm text-gray-400">No classes added yet. Add a class to start building the exam structure.</p>
      )}

      {examClasses.map((ec) => (
        <ExamClassCard key={ec.id} examId={examId} examClass={ec} />
      ))}

      {addingClass ? (
        <div className="flex items-end gap-2 rounded-xl border border-dashed border-indigo-300 p-3 dark:border-indigo-700">
          <div className="flex-1">
            <Select label="Class" value={classId} onValueChange={setClassId} placeholder="Select class">
              {classes
                .filter((c) => !examClasses.some((ec) => ec.classId === c.id))
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}{c.code ? ` (${c.code})` : ''}</SelectItem>
                ))}
            </Select>
          </div>
          <Button size="sm" loading={addClass.isPending} disabled={!classId} onClick={() => addClass.mutate()}>Add class</Button>
          <Button size="sm" variant="ghost" onClick={() => { setAddingClass(false); setClassId('') }}>Cancel</Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAddingClass(true)}>
          <Plus className="h-4 w-4" />Add class
        </Button>
      )}
    </div>
  )
}

// ── Exam Detail ───────────────────────────────────────────────────────────────

interface RankRow {
  rank: number
  student: { id: string; firstName: string; lastName: string; admissionNo: string }
  totalMarks: number
  percentage: number
  isPassed: boolean
}

function ExamDetail({ exam }: { exam: Exam }) {
  const qc = useQueryClient()
  const isPublished = exam.status === 'COMPLETED'

  const { data: ranking = [], isLoading: rankLoading } = useQuery<RankRow[]>({
    queryKey: ['exam-ranking', exam.id],
    queryFn: () => api.get(`/exams/${exam.id}/ranking`).then((r) => r.data),
  })

  const publish = useMutation({
    mutationFn: () => api.post(`/exams/${exam.id}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{exam.name}</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {dayjs(exam.startDate).format('D MMM')} – {dayjs(exam.endDate).format('D MMM YYYY')} · {exam.academicYear.name}
          </p>
          {(exam.totalMarks != null || exam.passingMarks != null) && (
            <p className="mt-1 text-xs text-gray-400">
              {exam.totalMarks != null && `Total: ${exam.totalMarks} marks`}
              {exam.totalMarks != null && exam.passingMarks != null && ' · '}
              {exam.passingMarks != null && `Pass: ${exam.passingMarks}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isPublished ? 'success' : 'warning'}>
            {isPublished ? 'Published' : 'Draft'}
          </Badge>
          {!isPublished && <MarksEntryModal exam={exam} />}
          {!isPublished && (
            <Button size="sm" variant="outline" loading={publish.isPending} onClick={() => publish.mutate()}>
              <CheckCircle className="h-4 w-4" />Publish results
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="structure">
        <TabsList>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="mt-4">
          <ExamStructureTab examId={exam.id} />
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Results &amp; Ranking</h4>
            </div>
            {rankLoading ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {[...Array(5)].map((_, i) => <div key={i} className="flex items-center gap-4 px-5 py-3"><div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></div>)}
              </div>
            ) : ranking.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">No results yet. Enter marks to generate rankings.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {ranking.map((r) => (
                  <div key={r.student.id} className="flex items-center gap-4 px-5 py-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      r.rank === 1 ? 'bg-amber-100 text-amber-700' : r.rank === 2 ? 'bg-gray-100 text-gray-600' : r.rank === 3 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-500 dark:bg-gray-800'
                    }`}>
                      {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{r.student.firstName} {r.student.lastName}</p>
                      <p className="text-xs text-gray-400">{r.student.admissionNo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.totalMarks}{exam.totalMarks != null ? ` / ${exam.totalMarks}` : ''}</p>
                      <p className="text-xs text-gray-400">{r.percentage.toFixed(1)}%</p>
                    </div>
                    <Badge variant={r.isPassed ? 'success' : 'danger'}>{r.isPassed ? 'Pass' : 'Fail'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExamsPage() {
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)

  const { data: exams = [], isLoading } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: () => api.get('/exams').then((r) => r.data),
  })

  const selectedExam = exams.find((e) => e.id === selectedExamId)

  return (
    <div>
      <PageHeader title="Examinations" subtitle="Create exams, enter marks, and publish results." action={<CreateExamModal onCreated={setSelectedExamId} />} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Exam list */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Exams</p>
          </div>
          {isLoading ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {[...Array(4)].map((_, i) => <div key={i} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></div>)}
            </div>
          ) : exams.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-400">No exams yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {exams.map((e) => {
                const isPublished = e.status === 'COMPLETED'
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedExamId(e.id)}
                    className={`flex w-full flex-col items-start px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedExamId === e.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                  >
                    <p className={`text-sm font-medium ${selectedExamId === e.id ? 'text-[#4F46E5]' : 'text-gray-900 dark:text-white'}`}>{e.name}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{e.academicYear.name}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant={isPublished ? 'success' : 'warning'}>
                        {isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Exam detail */}
        {selectedExam ? (
          <ExamDetail exam={selectedExam} />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-sm text-gray-400">Select an exam to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
