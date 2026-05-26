'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Users, CalendarCheck, CreditCard, BookOpen,
  Landmark, FileBarChart2, CheckSquare, Moon, Settings,
  LogOut, ChevronLeft, ChevronRight, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  permission: string | null
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { label: 'Students', href: '/students', icon: Users, permission: 'students:read' },
  { label: 'Attendance', href: '/attendance', icon: CalendarCheck, permission: 'attendance:read' },
  { label: 'Fees', href: '/fees', icon: CreditCard, permission: 'fees:read' },
  { label: 'Examinations', href: '/exams', icon: BookOpen, permission: 'exams:read' },
  { label: 'Accounts', href: '/accounts', icon: Landmark, permission: 'accounts:read' },
  { label: 'Reports', href: '/reports', icon: FileBarChart2, permission: 'reports:read' },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare, permission: null },
]

const MADRASA_ITEM: NavItem = {
  label: 'Madrasa', href: '/madrasa', icon: Moon, permission: 'madrasa:read',
}
const SETTINGS_ITEM: NavItem = {
  label: 'Settings', href: '/settings', icon: Settings, permission: null,
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, hasPermission, clearAuth, institutes, activeInstituteId, switchInstitute } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const [mounted, setMounted] = useState(false)
  const [switching, setSwitching] = useState(false)
  useEffect(() => setMounted(true), [])

  async function handleInstituteChange(id: string) {
    if (id === activeInstituteId || switching) return
    setSwitching(true)
    try {
      await switchInstitute(id)
      window.location.reload()
    } finally {
      setSwitching(false)
    }
  }

  const orgType = user?.organization?.type?.toUpperCase()
  const showMadrasa = mounted && (orgType === 'MADRASA' || orgType === 'HYBRID')

  const visibleItems = [
    ...NAV_ITEMS.filter((item) => !item.permission || (mounted && hasPermission(item.permission))),
    ...(showMadrasa ? [MADRASA_ITEM] : []),
    SETTINGS_ITEM,
  ]

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    clearAuth()
    window.location.href = '/login'
  }

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 transition-all duration-200 shrink-0',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-16 items-center border-b border-gray-100 dark:border-gray-800 px-4',
          !sidebarOpen && 'justify-center px-2'
        )}
      >
        {sidebarOpen ? (
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#4F46E5] dark:text-white truncate">Cognivia ERP</p>
            {user?.organization?.name && (
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.organization.name}</p>
            )}
          </div>
        ) : (
          <div className="h-8 w-8 rounded-lg bg-[#4F46E5] flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">C</span>
          </div>
        )}
      </div>

      {/* Institute switcher — only shown when user has multiple institutes */}
      {mounted && institutes.length > 1 && (
        <div className={cn('border-b border-gray-100 dark:border-gray-800 px-3 py-2', !sidebarOpen && 'px-2')}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
              <select
                value={activeInstituteId ?? ''}
                onChange={(e) => handleInstituteChange(e.target.value)}
                disabled={switching}
                className="flex-1 min-w-0 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              >
                {institutes.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex justify-center" title="Switch institute">
              <Building2 className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-50 text-[#4F46E5] dark:bg-white/10 dark:text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                !sidebarOpen && 'justify-center px-2'
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-2">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 rounded-lg p-2">
              <div className="h-8 w-8 shrink-0 rounded-full bg-indigo-100 dark:bg-white/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-[#4F46E5] dark:text-white">
                  {user.firstName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 shadow-sm text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  )
}
