'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { GraduationCap, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const schema = z.object({
  orgName: z.string().min(2, 'Required'),
  orgType: z.enum(['SCHOOL', 'COLLEGE', 'MADRASA', 'COACHING', 'HYBRID'], { error: 'Select a type' }),
  contactName: z.string().min(2, 'Required'),
  contactEmail: z.string().email('Valid email required'),
  contactPhone: z.string().optional(),
  estimatedStudents: z.coerce.number().int().min(1).optional().or(z.literal('')),
  message: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const ORG_TYPES = [
  { value: 'SCHOOL',   label: 'School' },
  { value: 'COLLEGE',  label: 'College / University' },
  { value: 'MADRASA',  label: 'Madrasa / Islamic Institute' },
  { value: 'COACHING', label: 'Coaching Centre' },
  { value: 'HYBRID',   label: 'Hybrid (multiple types)' },
]

export default function GetStartedPage() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  })

  async function onSubmit(data: FormData) {
    setServerError('')
    try {
      const res = await fetch('/api/onboarding-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, estimatedStudents: data.estimatedStudents || undefined }),
      })
      if (!res.ok) {
        const j = await res.json()
        setServerError(j.message ?? 'Something went wrong')
        return
      }
      setSubmitted(true)
    } catch {
      setServerError('Network error. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Request received!</h1>
          <p className="mt-3 text-gray-500">
            Thanks for your interest. The Revzion team will review your request and get in touch within 24 hours.
          </p>
          <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-sm text-[#4F46E5] hover:underline">
            <ArrowLeft className="h-4 w-4" />Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-lg">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#4F46E5]">
              <GraduationCap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Cognivia <span className="font-normal text-gray-400">ERP</span></span>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Request onboarding</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Fill in your details and the Revzion team will set up your organization within 24 hours.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Org info */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Organization</p>
              <div className="space-y-4">
                <Input label="Organization name *" placeholder="Al Noor Educational Trust" error={errors.orgName?.message} {...register('orgName')} />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Type *</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {ORG_TYPES.map(t => (
                      <label key={t.value} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${watch('orgType') === t.value ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5]' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                        <input type="radio" value={t.value} {...register('orgType')} className="sr-only" />
                        <span className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${watch('orgType') === t.value ? 'border-[#4F46E5] bg-[#4F46E5]' : 'border-gray-300'}`} />
                        {t.label}
                      </label>
                    ))}
                  </div>
                  {errors.orgType && <p className="mt-1 text-xs text-rose-500">{errors.orgType.message as string}</p>}
                </div>

                <Input
                  label="Estimated students"
                  type="number"
                  placeholder="e.g. 500"
                  error={errors.estimatedStudents?.message}
                  {...register('estimatedStudents')}
                />
              </div>
            </div>

            {/* Contact info */}
            <div className="border-t border-gray-100 pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Contact person</p>
              <div className="space-y-4">
                <Input label="Full name *" placeholder="Muhammad Arqam" error={errors.contactName?.message} {...register('contactName')} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Email *" type="email" placeholder="you@school.com" error={errors.contactEmail?.message} {...register('contactEmail')} />
                  <Input label="Phone" type="tel" placeholder="+92 300 0000000" {...register('contactPhone')} />
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="border-t border-gray-100 pt-5">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Message <span className="text-gray-400">(optional)</span></label>
              <textarea
                rows={3}
                placeholder="Any specific requirements, modules you need, or questions for us…"
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                {...register('message')}
              />
            </div>

            {serverError && (
              <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{serverError}</div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
              Submit request
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-[#4F46E5] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
