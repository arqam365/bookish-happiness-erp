'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { GraduationCap, Building2, LogOut, Inbox } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isHydrated, clearAuth } = useAuthStore()

  useEffect(() => {
    if (!isHydrated) return
    if (!user) { router.replace('/login'); return }
    if (!user.isSuperAdmin) router.replace('/dashboard')
  }, [user, isHydrated, router])

  async function handleLogout() {
    try { await api.post('/auth/logout', {}) } catch {}
    clearAuth()
    router.push('/login')
  }

  const { data: counts } = useQuery<{ pending: number }>({
    queryKey: ['sa-request-counts'],
    queryFn: () => api.get('/superadmin/onboarding-requests/counts').then(r => r.data),
    enabled: !!user?.isSuperAdmin,
  })

  if (!isHydrated || !user?.isSuperAdmin) return null

  const navItems = [
    { href: '/superadmin', label: 'Organizations', icon: Building2, badge: 0 },
    { href: '/superadmin/requests', label: 'Requests', icon: Inbox, badge: counts?.pending ?? 0 },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white dark:border-white/5 dark:bg-gray-900 flex flex-col">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-4 dark:border-white/5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#4F46E5]">
            <GraduationCap className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">Revzion</p>
            <p className="text-[10px] text-gray-400">Platform Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href || (href !== '/superadmin' && pathname.startsWith(href + '/'))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-indigo-50 text-[#4F46E5] dark:bg-indigo-900/20 dark:text-indigo-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-100 p-3 dark:border-white/5">
          <div className="mb-2 px-3 py-1">
            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{user.firstName} {user.lastName}</p>
            <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-8">
        {children}
      </main>
    </div>
  )
}
