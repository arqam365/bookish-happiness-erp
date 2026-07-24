'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Plus, ClipboardList, Trophy, CheckCircle, PenLine } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Select, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import api from '@/lib/api'

interface AcademicYear { id: string; name: string; isActive: boolean }
interface ExamType { id: string; name: string }
interface Subject { id: string; name: string; code: string | null }
interface Exam {
  id: string
  name: string
  startDate: string
  endDate: string
  totalMarks: number
  passingMarks: number
  isPublished: boolean
  academicYear: { name: string }
}

const createSchema = z.object({
  name: z.string().min(1, 'Required'),
  academicYearId: z.string().min(1, 'Required'),
  examTypeId: z.string().min(1, 'Required'),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
  totalMarks: z.coerce.number().positive(),
  passingMarks: z.coerce.number().positive(),
})
type CreateForm = z.infer<typeof createSchema>

function CreateExamModal() {
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exams'] }); setOpen(false); form.reset() },
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset() }}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" />Create exam</Button>
      </DialogTrigger>
      <DialogContent title="Create exam" description="Set up a new examination.">
        <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="space-y-4">
          <Input label="Exam name *" placeholder="Midterm 2025" error={form.formState.errors.name?.message} {...form.register('name')} />

          <div className="grid grid-cols-2 gap-3">
            <Select label="Academic year *" value={form.watch('academicYearId') ?? ''} onValueChange={(v) => form.setValue('academicYearId', v)} placeholder="Select" error={form.formState.errors.academicYearId?.message}>
              {years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}{y.isActive ? ' (Active)' : ''}</SelectItem>)}
            </Select>
            <Select label="Exam type *" value={form.watch('examTypeId') ?? ''} onValueChange={(v) => form.setValue('examTypeId', v)} placeholder="Select" error={form.formState.errors.examTypeId?.message}>
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

          <div className="grid grid-cols-2 gap-3">
            <Input label="Total marks *" type="number" error={form.formState.errors.totalMarks?.message} {...form.register('totalMarks')} />
            <Input label="Passing marks *" type="number" error={form.formState.errors.passingMarks?.message} {...form.register('passingMarks')} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancel</Button></DialogClose>
            <Button type="submit" size="sm" loading={create.isPending}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
                    <th className="w-28 px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Marks / {exam.totalMarks}</th>
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
                          max={exam.totalMarks}
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

interface RankRow {
  rank: number
  student: { id: string; firstName: string; lastName: string; admissionNo: string }
  totalMarks: number
  percentage: number
  isPassed: boolean
}

function ExamDetail({ exam }: { exam: Exam }) {
  const qc = useQueryClient()

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
          <p className="mt-1 text-xs text-gray-400">Total: {exam.totalMarks} marks · Pass: {exam.passingMarks}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={exam.isPublished ? 'success' : 'warning'}>
            {exam.isPublished ? 'Published' : 'Draft'}
          </Badge>
          {!exam.isPublished && <MarksEntryModal exam={exam} />}
          {!exam.isPublished && (
            <Button size="sm" variant="outline" loading={publish.isPending} onClick={() => publish.mutate()}>
              <CheckCircle className="h-4 w-4" />Publish results
            </Button>
          )}
        </div>
      </div>

      {/* Ranking */}
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
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.totalMarks} / {exam.totalMarks}</p>
                  <p className="text-xs text-gray-400">{r.percentage.toFixed(1)}%</p>
                </div>
                <Badge variant={r.isPassed ? 'success' : 'danger'}>{r.isPassed ? 'Pass' : 'Fail'}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ExamsPage() {
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)

  const { data: exams = [], isLoading } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: () => api.get('/exams').then((r) => r.data),
  })

  const selectedExam = exams.find((e) => e.id === selectedExamId)

  return (
    <div>
      <PageHeader title="Examinations" subtitle="Create exams, enter marks, and publish results." action={<CreateExamModal />} />

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
              {exams.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedExamId(e.id)}
                  className={`flex w-full flex-col items-start px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedExamId === e.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                >
                  <p className={`text-sm font-medium ${selectedExamId === e.id ? 'text-[#4F46E5]' : 'text-gray-900 dark:text-white'}`}>{e.name}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{e.academicYear.name}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge variant={e.isPublished ? 'success' : 'warning'}>
                      {e.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </button>
              ))}
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
