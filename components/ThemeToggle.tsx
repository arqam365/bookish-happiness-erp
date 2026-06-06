'use client'

import { Classic } from '@/components/ui/classic'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  useEffect(() => setMounted(true), [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      document.documentElement.style.setProperty('--theme-x', `${rect.left + rect.width / 2}px`)
      document.documentElement.style.setProperty('--theme-y', `${rect.top + rect.height / 2}px`)
    }
    if (!document.startViewTransition) {
      setTheme(next)
      return
    }
    document.startViewTransition(() => {
      document.documentElement.classList.toggle('dark', next === 'dark')
      setTheme(next)
    })
  }

  if (!mounted) return <div className="h-8 w-8" />

  return (
    <Classic
      ref={btnRef}
      onClick={toggleTheme}
      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white text-xl"
    />
  )
}
