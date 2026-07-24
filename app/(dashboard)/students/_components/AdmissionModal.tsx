'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus, ChevronRight, ChevronLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectItem } from '@/components/ui/select'
import api from '@/lib/api'

const step1Schema = z.object({
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

const step2Schema = z.object({
  academicYearId: z.string().min(1, 'Required'),
  classId: z.string().min(1, 'Required'),
  sectionId: z.string().optional(),
  rollNumber: z.string().optional(),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

interface AcademicYear { id: string; name: string; isActive: boolean }
interface ClassItem { id: string; name: string; sections: Array<{ id: string; name: string }> }

export function AdmissionModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const qc = useQueryClient()

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })

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

  const selectedClassId = form2.watch('classId')
  const selectedClass = classes.find((c) => c.id === selectedClassId)

  const admit = useMutation({
    mutationFn: async (data: { student: Step1Data; enrollment: Step2Data }) => {
      const payload = Object.fromEntries(Object.entries(data.student).filter(([, v]) => v !== '' && v !== undefined))
      const student = await api.post('/students', payload).then((r) => r.data)
      await api.post(`/students/${student.id}/enroll`, data.enrollment)
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
    setStep1Data(null)
    form1.reset()
    form2.reset()
  }

  function handleStep1(data: Step1Data) {
    setStep1Data(data)
    setStep(2)
  }

  function handleStep2(data: Step2Data) {
    if (!step1Data) return
    admit.mutate({ student: step1Data, enrollment: data })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4" />
          Admit student
        </Button>
      </DialogTrigger>

      <DialogContent
        title={step === 1 ? 'Admit new student' : 'Enrollment details'}
        description={`Step ${step} of 2 — ${step === 1 ? 'Personal information' : 'Class & academic year'}`}
        className="max-w-xl"
      >
        {/* Step indicator */}
        <div className="mb-5 flex items-center gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                s < step ? 'bg-emerald-500 text-white' : s === step ? 'bg-[#4F46E5] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 2 && <div className={`h-px w-12 ${s < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={form1.handleSubmit(handleStep1)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Admission no *"
                placeholder="ADM-2025-001"
                error={form1.formState.errors.admissionNo?.message}
                {...form1.register('admissionNo')}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Gender</label>
                <Select
                  value={form1.watch('gender') ?? ''}
                  onValueChange={(v) => form1.setValue('gender', v as 'MALE' | 'FEMALE' | 'OTHER')}
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
                error={form1.formState.errors.firstName?.message}
                {...form1.register('firstName')}
              />
              <Input
                label="Last name *"
                placeholder="Last name"
                error={form1.formState.errors.lastName?.message}
                {...form1.register('lastName')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Date of birth"
                type="date"
                {...form1.register('dateOfBirth')}
              />
              <Input
                label="Phone"
                placeholder="+91 98765 43210"
                {...form1.register('phone')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Religion" placeholder="Hindu / Muslim / Christian…" {...form1.register('religion')} />
              <Input label="Blood group" placeholder="A+" {...form1.register('bloodGroup')} />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="student@email.com"
              error={form1.formState.errors.email?.message}
              {...form1.register('email')}
            />

            <Input label="Address" placeholder="Street address" {...form1.register('address')} />

            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="sm">Cancel</Button>
              </DialogClose>
              <Button type="submit" size="sm">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={form2.handleSubmit(handleStep2)} className="space-y-4">
            <Select
              label="Academic year *"
              value={form2.watch('academicYearId')}
              onValueChange={(v) => form2.setValue('academicYearId', v)}
              placeholder="Select year"
              error={form2.formState.errors.academicYearId?.message}
            >
              {years.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}{y.isActive ? ' (Active)' : ''}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Class *"
              value={form2.watch('classId')}
              onValueChange={(v) => { form2.setValue('classId', v); form2.setValue('sectionId', '') }}
              placeholder="Select class"
              error={form2.formState.errors.classId?.message}
            >
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </Select>

            {selectedClass && selectedClass.sections.length > 0 && (
              <Select
                label="Section"
                value={form2.watch('sectionId')}
                onValueChange={(v) => form2.setValue('sectionId', v)}
                placeholder="Select section"
              >
                {selectedClass.sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </Select>
            )}

            <Input
              label="Roll number"
              placeholder="Optional"
              {...form2.register('rollNumber')}
            />

            <div className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
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
