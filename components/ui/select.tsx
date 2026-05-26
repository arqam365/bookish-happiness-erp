'use client'

import * as RadixSelect from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

export function Select({ value, onValueChange, placeholder, label, error, disabled, children, className }: SelectProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>}
      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger
          className={cn(
            'flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900',
            'dark:border-gray-700 dark:bg-gray-800 dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-gray-900',
            error && 'border-[#F43F5E] focus:ring-[#F43F5E]',
          )}
        >
          <RadixSelect.Value placeholder={<span className="text-gray-400">{placeholder}</span>} />
          <RadixSelect.Icon>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className="z-50 min-w-[8rem] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.Viewport className="p-1">
              {children}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && <p className="text-xs text-[#F43F5E]">{error}</p>}
    </div>
  )
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(({ value, children }, ref) => (
  <RadixSelect.Item
    ref={ref}
    value={value}
    className="relative flex cursor-pointer select-none items-center rounded-md px-8 py-2 text-sm text-gray-900 outline-none hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700"
  >
    <RadixSelect.ItemIndicator className="absolute left-2 flex items-center">
      <Check className="h-3.5 w-3.5 text-[#4F46E5]" />
    </RadixSelect.ItemIndicator>
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
  </RadixSelect.Item>
))
SelectItem.displayName = 'SelectItem'
