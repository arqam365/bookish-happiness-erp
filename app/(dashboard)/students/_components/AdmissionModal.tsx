'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus, ChevronRight, ChevronLeft, Search, UserCheck, UserCog } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectItem } from '@/components/ui/select'
import { ImageUpload } from '@/components/ui/image-upload'
import api from '@/lib/api'

// ── schemas ──────────────────────────────────────────────────────────────────

const newGuardianSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  relationship: z.string().min(1, 'Required'),
  phone: z.string().min(1, 'Required'),
  email: z.string().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
})

const studentSchema = z.object({
  admissionNo: z.string().min(1, 'Required'),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  religion: z.string().optional(),
  nationality: z.string().optional(),
  bloodGroup: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
})

const enrollmentSchema = z.object({
  academicYearId: z.string().min(1, 'Required'),
  classId: z.string().min(1, 'Required'),
  sectionId: z.string().optional(),
  rollNumber: z.string().optional(),
})

type NewGuardianData = z.infer<typeof newGuardianSchema>
type StudentData = z.infer<typeof studentSchema>
type EnrollmentData = z.infer<typeof enrollmentSchema>

// ── types ────────────────────────────────────────────────────────────────────

interface AcademicYear { id: string; name: string; isActive: boolean }
interface ClassItem { id: string; name: string; sections: Array<{ id: string; name: string }> }
interface GuardianListItem { id: string; firstName: string; lastName: string; phone: string; relationship: string }

// ── component ────────────────────────────────────────────────────────────────

export function AdmissionModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)

  // guardian state
  type GuardianMode = 'existing' | 'new'
  const [guardianMode, setGuardianMode] = useState<GuardianMode | null>(null)
  const [existingGuardianId, setExistingGuardianId] = useState('')
  const [guardianIsPrimary, setGuardianIsPrimary] = useState(true)
  const [guardianSearch, setGuardianSearch] = useState('')
  const [newGuardianData, setNewGuardianData] = useState<NewGuardianData | null>(null)

  // student state
  const [studentData, setStudentData] = useState<StudentData | null>(null)

  // document URLs (uploaded before submit)
  const [photo, setPhoto] = useState('')
  const [aadhaarFront, setAadhaarFront] = useState('')
  const [aadhaarBack, setAadhaarBack] = useState('')

  const qc = useQueryClient()

  const guardianForm = useForm<NewGuardianData>({ resolver: zodResolver(newGuardianSchema) })
  const studentForm = useForm<StudentData>({ resolver: zodResolver(studentSchema), defaultValues: { nationality: 'India' } })
  const enrollmentForm = useForm<EnrollmentData>({ resolver: zodResolver(enrollmentSchema) })

  // queries
  const { data: allGuardians = [] } = useQuery<GuardianListItem[]>({
    queryKey: ['guardians-all'],
    queryFn: () => api.get('/guardians?pageSize=500').then((r) => r.data.data ?? r.data),
    enabled: open && step === 2 && guardianMode === 'existing',
  })

  const { data: years = [] } = useQuery<AcademicYear[]>({
    queryKey: ['settings-academic-years'],
    queryFn: () => api.get('/settings/academic-years').then((r) => r.data),
    enabled: open,
  })

  const { data: classes = [] } = useQuery<ClassItem[]>({
    queryKey: ['settings-classes'],
    queryFn: () => api.get('/settings/classes').then((r) => r.data),
    enabled: open,
  })

  const filteredGuardians = useMemo(() => {
    const q = guardianSearch.toLowerCase()
    if (!q) return allGuardians
    return allGuardians.filter(
      (g) =>
        `${g.firstName ?? ''} ${g.lastName ?? ''}`.toLowerCase().includes(q) ||
        (g.phone ?? '').includes(q) ||
        (g.relationship ?? '').toLowerCase().includes(q),
    )
  }, [allGuardians, guardianSearch])

  const selectedClassId = enrollmentForm.watch('classId')
  const selectedClass = classes.find((c) => c.id === selectedClassId)

  // final submit — fires all API calls in sequence
  const admit = useMutation({
    mutationFn: async (enrollment: EnrollmentData) => {
      // 1. create or resolve guardian
      let guardianId: string
      if (guardianMode === 'new' && newGuardianData) {
        const g = await api.post('/guardians', { ...newGuardianData, isSponsor: false }).then((r) => r.data)
        guardianId = g.id
      } else {
        guardianId = existingGuardianId
      }

      // 2. create student
      const studentPayload = Object.fromEntries(
        Object.entries({ ...studentData!, ...(photo && { photo }), ...(aadhaarFront && { aadhaarFront }), ...(aadhaarBack && { aadhaarBack }) })
          .filter(([, v]) => v !== '' && v !== undefined),
      )
      const student = await api.post('/students', studentPayload).then((r) => r.data)

      // 3. enroll
      await api.post(`/students/${student.id}/enroll`, enrollment)

      // 4. link guardian
      await api.post(`/guardians/students/${student.id}/link`, { guardianId, isPrimary: guardianIsPrimary })

      return student
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['guardians'] })
      setOpen(false)
      reset()
    },
  })

  function reset() {
    setStep(1)
    setGuardianMode(null)
    setExistingGuardianId('')
    setGuardianIsPrimary(true)
    setGuardianSearch('')
    setNewGuardianData(null)
    setStudentData(null)
    setPhoto('')
    setAadhaarFront('')
    setAadhaarBack('')
    guardianForm.reset()
    studentForm.reset()
    enrollmentForm.reset()
  }

  function chooseMode(mode: GuardianMode) {
    setGuardianMode(mode)
    setStep(2)
  }

  function handleExistingGuardianNext() {
    if (!existingGuardianId) return
    setStep(3)
  }

  function handleNewGuardian(data: NewGuardianData) {
    setNewGuardianData(data)
    setStep(3)
  }

  function handleStudentInfo(data: StudentData) {
    setStudentData(data)
    setStep(4)
  }

  function handleEnrollment(data: EnrollmentData) {
    admit.mutate(data)
  }

  // step labels for indicator
  const stepLabels = ['Guardian?', guardianMode === 'new' ? 'New guardian' : 'Link guardian', 'Student info', 'Enrollment']
  const stepTitles = [
    'Guardian check',
    guardianMode === 'new' ? 'Add new guardian' : 'Link existing guardian',
    'Student personal info',
    'Enrollment details',
  ]
  const TOTAL_STEPS = 4

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4" />
          Admit student
        </Button>
      </DialogTrigger>

      <DialogContent
        title={stepTitles[step - 1]}
        description={`Step ${step} of ${TOTAL_STEPS}`}
        className="max-w-xl"
      >
        {/* Step indicator */}
        <div className="mb-5 flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  s < step
                    ? 'bg-emerald-500 text-white'
                    : s === step
                    ? 'bg-[#4F46E5] text-white'
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < TOTAL_STEPS && (
                <div className={`h-px w-10 ${s < step ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 1: Guardian check ── */}
        {step === 1 && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Is this student&apos;s guardian already registered in the system?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => chooseMode('existing')}
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 p-5 text-center transition-all hover:border-[#4F46E5] hover:bg-indigo-50 dark:border-gray-700 dark:hover:border-[#4F46E5] dark:hover:bg-indigo-950"
              >
                <UserCheck className="h-8 w-8 text-[#4F46E5]" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Yes, already added</p>
                  <p className="mt-0.5 text-xs text-gray-500">Search and link by name or ID</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => chooseMode('new')}
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 p-5 text-center transition-all hover:border-emerald-500 hover:bg-emerald-50 dark:border-gray-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-950"
              >
                <UserCog className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">No, add new guardian</p>
                  <p className="mt-0.5 text-xs text-gray-500">Register guardian details now</p>
                </div>
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="sm">Cancel</Button>
              </DialogClose>
            </div>
          </div>
        )}

        {/* ── Step 2a: Search existing guardian ── */}
        {step === 2 && guardianMode === 'existing' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or relationship…"
                value={guardianSearch}
                onChange={(e) => setGuardianSearch(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <Select
              label="Guardian *"
              value={existingGuardianId}
              onValueChange={setExistingGuardianId}
              placeholder="Select guardian"
            >
              {filteredGuardians.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.firstName} {g.lastName} · {g.relationship} · {g.phone}
                </SelectItem>
              ))}
            </Select>

            {existingGuardianId && (
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={guardianIsPrimary}
                  onChange={(e) => setGuardianIsPrimary(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Mark as primary guardian
              </label>
            )}

            <div className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!existingGuardianId}
                onClick={handleExistingGuardianNext}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2b: New guardian form ── */}
        {step === 2 && guardianMode === 'new' && (
          <form onSubmit={guardianForm.handleSubmit(handleNewGuardian)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name *"
                placeholder="First name"
                error={guardianForm.formState.errors.firstName?.message}
                {...guardianForm.register('firstName')}
              />
              <Input
                label="Last name *"
                placeholder="Last name"
                error={guardianForm.formState.errors.lastName?.message}
                {...guardianForm.register('lastName')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Relationship *"
                placeholder="Father / Mother / Uncle…"
                error={guardianForm.formState.errors.relationship?.message}
                {...guardianForm.register('relationship')}
              />
              <Input
                label="Phone *"
                placeholder="+91 98765 43210"
                error={guardianForm.formState.errors.phone?.message}
                {...guardianForm.register('phone')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Email" type="email" placeholder="email@example.com" {...guardianForm.register('email')} />
              <Input label="Occupation" placeholder="Engineer / Farmer…" {...guardianForm.register('occupation')} />
            </div>
            <Input label="Address" placeholder="Full address" {...guardianForm.register('address')} />

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={guardianIsPrimary}
                onChange={(e) => setGuardianIsPrimary(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Mark as primary guardian
            </label>

            <div className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button type="submit" size="sm">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 3: Student personal info ── */}
        {step === 3 && (
          <form onSubmit={studentForm.handleSubmit(handleStudentInfo)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Admission no *"
                placeholder="ADM-2025-001"
                error={studentForm.formState.errors.admissionNo?.message}
                {...studentForm.register('admissionNo')}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Gender</label>
                <Select
                  value={studentForm.watch('gender') ?? ''}
                  onValueChange={(v) => studentForm.setValue('gender', v as 'MALE' | 'FEMALE' | 'OTHER')}
                  placeholder="Select"
                >
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name *"
                placeholder="First name"
                error={studentForm.formState.errors.firstName?.message}
                {...studentForm.register('firstName')}
              />
              <Input
                label="Last name *"
                placeholder="Last name"
                error={studentForm.formState.errors.lastName?.message}
                {...studentForm.register('lastName')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date of birth" type="date" {...studentForm.register('dateOfBirth')} />
              <Input label="Phone" placeholder="+91 98765 43210" {...studentForm.register('phone')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Religion" placeholder="Hindu / Muslim / Christian…" {...studentForm.register('religion')} />
              <Input label="Blood group" placeholder="A+" {...studentForm.register('bloodGroup')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Nationality" {...studentForm.register('nationality')} />
              <Input label="City" {...studentForm.register('city')} />
            </div>
            <Input
              label="Email"
              type="email"
              placeholder="student@email.com"
              error={studentForm.formState.errors.email?.message}
              {...studentForm.register('email')}
            />
            <Input label="Address" placeholder="Street address" {...studentForm.register('address')} />

            <div className="grid grid-cols-3 gap-3 pt-1">
              <ImageUpload label="Student photo" value={photo} onChange={setPhoto} folder="students/photos" />
              <ImageUpload label="Aadhaar front" value={aadhaarFront} onChange={setAadhaarFront} folder="students/aadhaar" />
              <ImageUpload label="Aadhaar back" value={aadhaarBack} onChange={setAadhaarBack} folder="students/aadhaar" />
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep(2)}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button type="submit" size="sm">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 4: Enrollment ── */}
        {step === 4 && (
          <form onSubmit={enrollmentForm.handleSubmit(handleEnrollment)} className="space-y-4">
            <Select
              label="Academic year *"
              value={enrollmentForm.watch('academicYearId')}
              onValueChange={(v) => enrollmentForm.setValue('academicYearId', v)}
              placeholder="Select year"
              error={enrollmentForm.formState.errors.academicYearId?.message}
            >
              {years.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}{y.isActive ? ' (Active)' : ''}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Class *"
              value={enrollmentForm.watch('classId')}
              onValueChange={(v) => { enrollmentForm.setValue('classId', v); enrollmentForm.setValue('sectionId', '') }}
              placeholder="Select class"
              error={enrollmentForm.formState.errors.classId?.message}
            >
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </Select>

            {selectedClass && selectedClass.sections.length > 0 && (
              <Select
                label="Section"
                value={enrollmentForm.watch('sectionId')}
                onValueChange={(v) => enrollmentForm.setValue('sectionId', v)}
                placeholder="Select section"
              >
                {selectedClass.sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </Select>
            )}

            <Input label="Roll number" placeholder="Optional" {...enrollmentForm.register('rollNumber')} />

            {admit.isError && (
              <p className="text-sm text-red-500">
                {(admit.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong. Please try again.'}
              </p>
            )}

            <div className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep(3)}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button type="submit" size="sm" loading={admit.isPending}>
                Admit student
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
