'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export function SuperAdminRedirect() {
  const router = useRouter()
  const { user, isHydrated } = useAuthStore()

  useEffect(() => {
    if (!isHydrated) return
    if (user?.isSuperAdmin) router.replace('/superadmin')
  }, [user, isHydrated, router])

  return null
}
