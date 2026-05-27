'use client'

import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import { setApiToken } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import type { Institute } from '@/store/auth.store'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setInstitutes = useAuthStore((s) => s.setInstitutes)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError('')
    try {
      const { data: signInData, error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        fetchOptions: { credentials: 'include' },
      })

      if (error || !signInData) {
        setServerError(error?.message ?? 'Invalid credentials')
        return
      }

      const token = (signInData as any).token as string
      if (!token) {
        setServerError('Authentication failed. Please try again.')
        return
      }

      setApiToken(token)

      // Load user profile + permissions + institutes
      const [meRes, instRes] = await Promise.all([
        api.get<{ id: string; firstName: string; lastName: string; email: string; organizationId: string; isSuperAdmin: boolean; organization: any }>('/auth/me'),
        api.get<Institute[]>('/auth/institutes'),
      ])

      setAuth({
        user: meRes.data,
        permissions: [],
        accessToken: token,
      })
      setInstitutes(instRes.data)

      if (meRes.data.isSuperAdmin) {
        router.push('/superadmin')
        return
      }
      const raw = searchParams.get('next') ?? '/dashboard'
      const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard'
      router.push(next)
    } catch {
      setServerError('Network error. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#4F46E5]">
            <span className="text-lg font-bold text-white">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign in to Cognivia</h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#4F46E5] font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-white/5 dark:bg-[#111118]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#F43F5E]">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-[#F43F5E]">
                {serverError}
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
