'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setApiToken, setApiInstituteId, clearApiToken } from '@/lib/api'

export interface Institute {
  id: string
  name: string
  type: string
  code: string | null
  logo: string | null
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  organizationId: string
  isSuperAdmin?: boolean
  organization?: { id: string; name: string; type: string }
}

interface AuthState {
  user: User | null
  permissions: string[]
  institutes: Institute[]
  activeInstituteId: string | null
  accessToken: string | null
  isHydrated: boolean
  setAuth: (data: { user: User; permissions: string[]; accessToken: string }) => void
  setInstitutes: (institutes: Institute[]) => void
  clearAuth: () => void
  switchInstitute: (id: string) => Promise<void>
  hasPermission: (permission: string) => boolean
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      permissions: [],
      institutes: [],
      activeInstituteId: null,
      accessToken: null,
      isHydrated: false,

      setAuth: ({ user, permissions, accessToken }) => {
        setApiToken(accessToken)
        set({ user, permissions, accessToken })
      },

      setInstitutes: (institutes) => {
        const current = get().activeInstituteId
        const firstId = institutes[0]?.id ?? null
        const activeId = current && institutes.some((i) => i.id === current) ? current : firstId
        if (activeId) setApiInstituteId(activeId)
        set({ institutes, activeInstituteId: activeId })
      },

      clearAuth: () => {
        clearApiToken()
        if (typeof window !== 'undefined') {
          fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {})
        }
        set({ user: null, permissions: [], institutes: [], activeInstituteId: null, accessToken: null })
      },

      switchInstitute: async (instituteId) => {
        setApiInstituteId(instituteId)
        set({ activeInstituteId: instituteId })
      },

      hasPermission: (permission) => (get().permissions ?? []).includes(permission),

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'cognivia-auth',
      partialize: (state) => ({
        user: state.user,
        permissions: state.permissions,
        institutes: state.institutes,
        activeInstituteId: state.activeInstituteId,
        accessToken: state.accessToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setApiToken(state.accessToken)
        if (state?.activeInstituteId) setApiInstituteId(state.activeInstituteId)
        state?.setHydrated()
      },
    }
  )
)
