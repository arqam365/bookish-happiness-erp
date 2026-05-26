import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-white/10 dark:text-gray-200',
  warning: 'bg-amber-50 text-amber-700 dark:bg-white/10 dark:text-gray-200',
  danger: 'bg-rose-50 text-rose-700 dark:bg-white/10 dark:text-gray-200',
  info: 'bg-indigo-50 text-indigo-700 dark:bg-white/10 dark:text-gray-200',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
