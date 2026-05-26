import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400',
            'dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-gray-900 dark:disabled:text-gray-600',
            error && 'border-[#F43F5E] focus:ring-[#F43F5E]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#F43F5E]">{error}</p>}
        {!error && hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
