'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useEffect, useRef } from 'react'
import { getQueryClient } from '@/lib/query-client'
import { setApiToken } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const refreshed = useRef(false)

  useEffect(() => {
    if (!isHydrated || !user || refreshed.current) return
    refreshed.current = true

    fetch('/api/auth/refresh', { method: 'POST' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.accessToken) setApiToken(data.accessToken)
        else clearAuth()
      })
      .catch(() => clearAuth())
  }, [isHydrated, user, clearAuth])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthHydrator>{children}</AuthHydrator>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
