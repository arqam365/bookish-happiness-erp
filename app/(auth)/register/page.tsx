'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ORG_TYPES = [
  { value: 'SCHOOL', label: 'School' },
  { value: 'COLLEGE', label: 'College' },
  { value: 'MADRASA', label: 'Madrasa' },
  { value: 'HYBRID', label: 'Hybrid (Religious + Modern)' },
] as const

const schema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  organizationType: z.enum(['SCHOOL', 'COLLEGE', 'MADRASA', 'HYBRID']),
  adminName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { organizationType: 'SCHOOL' },
  })

  async function onSubmit(data: FormData) {
    setServerError('')
    try {
      const nameParts = data.adminName.trim().split(/\s+/)
      const firstName = nameParts[0]
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0]
      const organizationSlug = data.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: data.email,
          password: data.password,
          organizationName: data.organizationName,
          organizationType: data.organizationType,
          organizationSlug,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.message ?? 'Registration failed')
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setServerError('Network error. Please try again.')
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <span className="text-xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Organization created!</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Redirecting you to login…</p>
        </div>
      </div>
    )
  }

  const selectedType = watch('organizationType')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#4F46E5]">
            <span className="text-lg font-bold text-white">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your organization</h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-[#4F46E5] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-white/5 dark:bg-[#111118]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Organization name"
              placeholder="Al-Noor Academy"
              error={errors.organizationName?.message}
              {...register('organizationName')}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Organization type</label>
              <div className="grid grid-cols-2 gap-2">
                {ORG_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setValue('organizationType', t.value)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                      selectedType === t.value
                        ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5] dark:bg-indigo-900/20 dark:text-indigo-400'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-white/10 dark:text-gray-400 dark:hover:border-white/20'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-white/5 pt-2" />

            <Input
              label="Your name"
              placeholder="Ahmed Ali"
              error={errors.adminName?.message}
              {...register('adminName')}
            />

            <Input
              label="Email address"
              type="email"
              placeholder="admin@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Minimum 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />

            {serverError && (
              <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-[#F43F5E]">
                {serverError}
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
              Create organization
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
