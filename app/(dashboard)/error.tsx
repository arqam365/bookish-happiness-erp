'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/30">
        <AlertTriangle className="h-6 w-6 text-rose-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Something went wrong</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{error.message || 'An unexpected error occurred.'}</p>
      </div>
      <Button variant="outline" size="sm" onClick={reset}>
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}
