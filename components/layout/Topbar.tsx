'use client'

import { Bell, Menu } from 'lucide-react'
import { Classic } from '@/components/ui/classic'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { useNotificationSocket } from '@/hooks/useSocket'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/attendance': 'Attendance',
  '/fees': 'Fees',
  '/exams': 'Examinations',
  '/accounts': 'Accounts',
  '/reports': 'Reports',
  '/tasks': 'Tasks',
  '/madrasa': 'Madrasa',
  '/settings': 'Settings',
}

function getTitle(pathname: string): string {
  for (const [prefix, title] of Object.entries(ROUTE_TITLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return title
  }
  return 'Cognivia ERP'
}

interface InAppNotification { id: string; title: string; body: string; createdAt: string }

function NotificationBell() {
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  const handleNotification = useCallback((n: InAppNotification) => {
    setNotifications((prev) => [n, ...prev].slice(0, 20))
    setUnread((c) => c + 1)
  }, [])

  useNotificationSocket(handleNotification)

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((v) => !v); if (!open) setUnread(0) }}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        {unread === 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
            </div>
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">No notifications yet.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{n.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{n.body}</p>
                    <p className="mt-1 text-[10px] text-gray-400">{dayjs(n.createdAt).fromNow()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function Topbar() {
  const pathname = usePathname()
  const { setSidebarOpen, sidebarOpen } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const themeBtnRef = useRef<HTMLButtonElement>(null)
  useEffect(() => setMounted(true), [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    if (themeBtnRef.current) {
      const rect = themeBtnRef.current.getBoundingClientRect()
      document.documentElement.style.setProperty('--theme-x', `${rect.left + rect.width / 2}px`)
      document.documentElement.style.setProperty('--theme-y', `${rect.top + rect.height / 2}px`)
    }
    if (!document.startViewTransition) {
      setTheme(next)
      return
    }
    document.startViewTransition(() => {
      // next-themes applies the class in a useEffect (async), so we toggle it
      // synchronously here so the transition snapshot captures the new theme.
      document.documentElement.classList.toggle('dark', next === 'dark')
      setTheme(next)
    })
  }

  return (
    <header className="flex h-16 shrink-0 items-center border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 px-6 gap-4">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100">
        {getTitle(pathname)}
      </h1>

      <div className="flex items-center gap-2">
        {mounted && (
          <Classic
            ref={themeBtnRef}
            onClick={toggleTheme}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 text-xl"
          />
        )}

        {mounted && <NotificationBell />}

        {user && (
          <div
            className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center cursor-default"
            title={`${user.firstName} ${user.lastName}`}
          >
            <span className="text-xs font-semibold text-[#4F46E5] dark:text-indigo-300">
              {user.firstName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
