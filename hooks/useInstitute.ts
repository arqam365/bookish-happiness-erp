'use client'

import { useAuthStore } from '@/store/auth.store'

export function useInstitute() {
  const institutes = useAuthStore((s) => s.institutes)
  const activeInstituteId = useAuthStore((s) => s.activeInstituteId)
  const switchInstitute = useAuthStore((s) => s.switchInstitute)

  const activeInstitute = institutes.find((i) => i.id === activeInstituteId)

  return { institutes, activeInstitute, switchInstitute }
}
