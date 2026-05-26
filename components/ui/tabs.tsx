'use client'

import * as RadixTabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export function Tabs({ children, ...props }: RadixTabs.TabsProps) {
  return <RadixTabs.Root {...props}>{children}</RadixTabs.Root>
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <RadixTabs.List
      className={cn(
        'flex border-b border-gray-200 dark:border-gray-700',
        className,
      )}
    >
      {children}
    </RadixTabs.List>
  )
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  return (
    <RadixTabs.Trigger
      value={value}
      className={cn(
        'relative px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors',
        'hover:text-gray-800 dark:text-gray-400 dark:hover:text-white',
        'focus:outline-none',
        'data-[state=active]:text-[#4F46E5] dark:data-[state=active]:text-indigo-400',
        'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full',
        'after:bg-[#4F46E5] after:opacity-0 data-[state=active]:after:opacity-100',
        className,
      )}
    >
      {children}
    </RadixTabs.Trigger>
  )
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  return (
    <RadixTabs.Content value={value} className={cn('pt-5', className)}>
      {children}
    </RadixTabs.Content>
  )
}
