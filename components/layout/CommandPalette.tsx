'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, CalendarCheck, DollarSign, BookOpen,
  BarChart2, Settings, ListChecks, Building2, Moon, Wallet,
  Search,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

interface CommandItem {
  id: string
  label: string
  href: string
  icon: React.ElementType
  keywords: string
  permission?: string
  superAdminOnly?: boolean
}

const ALL_COMMANDS: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: 'home overview' },
  { id: 'students', label: 'Students', href: '/students', icon: Users, keywords: 'student list enroll admit', permission: 'students:read' },
  { id: 'students-new', label: 'Admit new student', href: '/students?action=new', icon: Users, keywords: 'add create admit student new', permission: 'students:create' },
  { id: 'attendance', label: 'Attendance', href: '/attendance', icon: CalendarCheck, keywords: 'attendance mark daily present absent', permission: 'attendance:read' },
  { id: 'fees', label: 'Fees', href: '/fees', icon: DollarSign, keywords: 'fees payment collect defaulter', permission: 'fees:read' },
  { id: 'exams', label: 'Examinations', href: '/exams', icon: BookOpen, keywords: 'exam test result grade', permission: 'exams:read' },
  { id: 'accounts', label: 'Accounts', href: '/accounts', icon: Wallet, keywords: 'accounts ledger voucher day book', permission: 'accounts:read' },
  { id: 'reports', label: 'Reports', href: '/reports', icon: BarChart2, keywords: 'report analytics strength attendance defaulter', permission: 'reports:read' },
  { id: 'tasks', label: 'Tasks', href: '/tasks', icon: ListChecks, keywords: 'tasks todo assign' },
  { id: 'madrasa', label: 'Madrasa', href: '/madrasa', icon: Moon, keywords: 'madrasa hifz sponsorship donation', permission: 'madrasa:read' },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings, keywords: 'settings classes sections academic year', permission: 'settings:read' },
  { id: 'super-admin', label: 'Super Admin Panel', href: '/super-admin', icon: Building2, keywords: 'super admin platform panel orgs', superAdminOnly: true },
]

function score(item: CommandItem, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return item.label.toLowerCase().includes(q) || item.keywords.toLowerCase().includes(q)
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const user = useAuthStore((s) => s.user)
  const [cursor, setCursor] = useState(0)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const filtered = useMemo(() => {
    return ALL_COMMANDS.filter((cmd) => {
      if (cmd.superAdminOnly && !user?.isSuperAdmin) return false
      if (cmd.permission && !hasPermission(cmd.permission)) return false
      return score(cmd, query)
    })
  }, [query, hasPermission, user])

  useEffect(() => { setCursor(0) }, [query])

  function run(href: string) {
    router.push(href)
    setOpen(false)
    setQuery('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && filtered[cursor]) { run(filtered[cursor].href) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setOpen(false); setQuery('') }} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 dark:border-gray-700">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages and actions…"
            className="flex-1 bg-transparent py-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
          />
          <kbd className="hidden rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400 dark:border-gray-600 dark:bg-gray-800 sm:inline-block">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No results for &ldquo;{query}&rdquo;</p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((cmd, i) => (
                <button
                  key={cmd.id}
                  onClick={() => run(cmd.href)}
                  onMouseEnter={() => setCursor(i)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    i === cursor
                      ? 'bg-indigo-50 text-[#4F46E5] dark:bg-indigo-900/30 dark:text-indigo-300'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <cmd.icon className={`h-4 w-4 shrink-0 ${i === cursor ? 'text-[#4F46E5] dark:text-indigo-300' : 'text-gray-400'}`} />
                  <span>{cmd.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-2 dark:border-gray-700">
          <p className="text-[10px] text-gray-400">
            <kbd className="mr-0.5 rounded border border-gray-200 bg-gray-100 px-1 dark:border-gray-600 dark:bg-gray-800">↑↓</kbd> navigate
            <kbd className="mx-0.5 ml-2 rounded border border-gray-200 bg-gray-100 px-1 dark:border-gray-600 dark:bg-gray-800">↵</kbd> open
            <kbd className="mx-0.5 ml-2 rounded border border-gray-200 bg-gray-100 px-1 dark:border-gray-600 dark:bg-gray-800">⌘K</kbd> toggle
          </p>
        </div>
      </div>
    </div>
  )
}
