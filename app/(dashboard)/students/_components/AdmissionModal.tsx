'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus, ChevronRight, ChevronLeft, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectItem } from '@/components/ui/select'
import api from '@/lib/api'

const step2Schema = z.object({
  admissionNo: z.string().min(1, 'Required'),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
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

const step3Schema = z.object({
  academicYearId: z.string().min(1, 'Required'),
  classId: z.string().min(1, 'Required'),
  sectionId: z.string().optional(),
  rollNumber: z.string().optional(),
})

type Step2Data = z.infer<typeof step2Schema>
type Step3Data = z.infer<typeof step3Schema>

interface AcademicYear { id: string; name: string; isActive: boolean }
interface ClassItem { id: string; name: string; sections: Array<{ id: string; name: string }> }
interface GuardianListItem { id: string; firstName: string; lastName: string; phone: string; relationship: string }

export function AdmissionModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)

  // Step 1 state (guardian selection)
  const [guardianId, setGuardianId] = useState('')
  const [isPrimary, setIsPrimary] = useState(true)
  const [guardianSearch, setGuardianSearch] = useState('')

  // Step 2 data (held until final submit)
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null)

  const qc = useQueryClient()

  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) })

  const { data: allGuardians = [] } = useQuery<GuardianListItem[]>({
    queryKey: ['guardians-all'],
    queryFn: () => api.get('/guardians?limit=500').then((r) => r.data.data ?? r.data),
    enabled: open && step === 1,
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

  const guardians = useMemo(() => {
    const q = guardianSearch.toLowerCase()
    if (!q) return allGuardians
    return allGuardians.filter(
      (g) =>
        `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) ||
        g.phone.includes(q) ||
        g.relationship.toLowerCase().includes(q),
    )
  }, [allGuardians, guardianSearch])

  const selectedClassId = form3.watch('classId')
  const selectedClass = classes.find((c) => c.id === selectedClassId)

  const admit = useMutation({
    mutationFn: async (data: { student: Step2Data; enrollment: Step3Data }) => {
      const payload = Object.fromEntries(Object.entries(data.student).filter(([, v]) => v !== '' && v !== undefined))
      const student = await api.post('/students', payload).then((r) => r.data)
      await api.post(`/students/${student.id}/enroll`, data.enrollment)
      if (guardianId) {
        await api.post(`/guardians/students/${student.id}/link`, { guardianId, isPrimary })
      }
      return student
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      setOpen(false)
      reset()
    },
  })

  function reset() {
    setStep(1)
    setStep2Data(null)
    setGuardianId('')
    setIsPrimary(true)
    setGuardianSearch('')
    form2.reset()
    form3.reset()
  }

  function handleStep2(data: Step2Data) {
    setStep2Data(data)
    setStep(3)
  }

  function handleStep3(data: Step3Data) {
    if (!step2Data) return
    admit.mutate({ student: step2Data, enrollment: data })
  }

  const TOTAL_STEPS = 3
  const stepLabels = ['Link guardian', 'Personal info', 'Enrollment']

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4" />
          Admit student
        </Button>
      </DialogTrigger>

      <DialogContent
        title={stepLabels[step - 1]}
        description={`Step ${step} of ${TOTAL_STEPS} — ${
          step === 1 ? 'Link an existing guardian (optional)' :
          step === 2 ? 'Personal information' :
          'Class & academic year'
        }`}
        className="max-w-xl"
      >
        {/* Step indicator */}
        <div className="mb-5 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                s < step ? 'bg-emerald-500 text-white' : s === step ? 'bg-[#4F46E5] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < TOTAL_STEPS && <div className={`h-px w-12 ${s < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Guardian selection */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Search by name, phone, or relationship. If a sibling is already admitted, their guardian will appear here.
            </p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search guardian…"
                value={guardianSearch}
                onChange={(e) => setGuardianSearch(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <Select
              label="Guardian"
              value={guardianId}
              onValueChange={setGuardianId}
              placeholder="Select guardian"
            >
              {guardians.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.firstName} {g.lastName} · {g.relationship} · {g.phone}
                </SelectItem>
              ))}
            </Select>

            {guardianId && (
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Mark as primary guardian
              </label>
            )}

            <div className="flex justify-between gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="sm">Cancel</Button>
              </DialogClose>
              <div className="flex gap-2">
                {guardianId ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setGuardianId(''); setStep(2) }}>
                    Skip
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStep(2)}>
                    Skip
                  </Button>
                )}
                <Button type="button" size="sm" onClick={() => setStep(2)}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Personal info */}
        {step === 2 && (
          <form onSubmit={form2.handleSubmit(handleStep2)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Admission no *"
                placeholder="ADM-2025-001"
                error={form2.formState.errors.admissionNo?.message}
                {...form2.register('admissionNo')}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Gender</label>
                <Select
                  value={form2.watch('gender') ?? ''}
                  onValueChange={(v) => form2.setValue('gender', v as 'MALE' | 'FEMALE' | 'OTHER')}
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
                error={form2.formState.errors.firstName?.message}
                {...form2.register('firstName')}
              />
              <Input
                label="Last name *"
                placeholder="Last name"
                error={form2.formState.errors.lastName?.message}
                {...form2.register('lastName')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Date of birth" type="date" {...form2.register('dateOfBirth')} />
              <Input label="Phone" placeholder="+91 98765 43210" {...form2.register('phone')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Religion" placeholder="Hindu / Muslim / Christian…" {...form2.register('religion')} />
              <Input label="Blood group" placeholder="A+" {...form2.register('bloodGroup')} />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="student@email.com"
              error={form2.formState.errors.email?.message}
              {...form2.register('email')}
            />

            <Input label="Address" placeholder="Street address" {...form2.register('address')} />

            <div className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button type="submit" size="sm">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 3 — Enrollment */}
        {step === 3 && (
          <form onSubmit={form3.handleSubmit(handleStep3)} className="space-y-4">
            <Select
              label="Academic year *"
              value={form3.watch('academicYearId')}
              onValueChange={(v) => form3.setValue('academicYearId', v)}
              placeholder="Select year"
              error={form3.formState.errors.academicYearId?.message}
            >
              {years.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}{y.isActive ? ' (Active)' : ''}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Class *"
              value={form3.watch('classId')}
              onValueChange={(v) => { form3.setValue('classId', v); form3.setValue('sectionId', '') }}
              placeholder="Select class"
              error={form3.formState.errors.classId?.message}
            >
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </Select>

            {selectedClass && selectedClass.sections.length > 0 && (
              <Select
                label="Section"
                value={form3.watch('sectionId')}
                onValueChange={(v) => form3.setValue('sectionId', v)}
                placeholder="Select section"
              >
                {selectedClass.sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </Select>
            )}

            <Input label="Roll number" placeholder="Optional" {...form3.register('rollNumber')} />

            <div className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep(2)}>
                <ChevronLeft className="h-4 w-4" />
                Back
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
