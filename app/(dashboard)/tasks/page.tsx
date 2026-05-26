'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, CheckCircle2, Circle, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

interface TaskUser {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
}

interface Task {
  id: string
  title: string
  description: string | null
  isCompleted: boolean
  completedAt: string | null
  dueDate: string | null
  assignedTo: TaskUser | null
  createdBy: TaskUser
  createdAt: string
}

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function TaskRow({ task, onComplete }: { task: Task; onComplete: (id: string) => void }) {
  const isOverdue = !task.isCompleted && task.dueDate && dayjs(task.dueDate).isBefore(dayjs(), 'day')

  return (
    <div className={cn(
      'flex items-start gap-3 px-5 py-4 transition-colors',
      task.isCompleted && 'opacity-50',
    )}>
      <button
        onClick={() => !task.isCompleted && onComplete(task.id)}
        className="mt-0.5 shrink-0 text-gray-300 hover:text-indigo-500 transition-colors disabled:pointer-events-none"
        disabled={task.isCompleted}
        aria-label={task.isCompleted ? 'Completed' : 'Mark complete'}
      >
        {task.isCompleted
          ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          : <Circle className="h-5 w-5" />
        }
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium text-gray-900 dark:text-white', task.isCompleted && 'line-through')}>
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{task.description}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
          {task.assignedTo && (
            <span>→ {task.assignedTo.firstName} {task.assignedTo.lastName}</span>
          )}
          {task.dueDate && (
            <span className={cn(isOverdue && 'text-rose-500 font-medium')}>
              Due {dayjs(task.dueDate).format('DD MMM YYYY')}
              {isOverdue && ' (Overdue)'}
            </span>
          )}
          <span>by {task.createdBy.firstName}</span>
        </div>
      </div>

      {task.isCompleted && (
        <Badge variant="success" className="shrink-0 text-xs">Done</Badge>
      )}
    </div>
  )
}

function NewTaskForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const create = useMutation({
    mutationFn: (data: FormData) => api.post('/tasks', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    },
  })

  return (
    <form onSubmit={handleSubmit((d) => create.mutateAsync(d))}
      className="rounded-xl border border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20 p-4 space-y-3"
    >
      <Input
        label="Task title"
        placeholder="e.g. Review fee collection report"
        error={errors.title?.message}
        {...register('title')}
      />
      <Input
        label="Description (optional)"
        placeholder="Any additional notes..."
        {...register('description')}
      />
      <Input
        label="Due date (optional)"
        type="date"
        {...register('dueDate')}
      />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="submit" size="sm" loading={isSubmitting}>Create Task</Button>
      </div>
    </form>
  )
}

export default function TasksPage() {
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending')
  const queryClient = useQueryClient()

  const completed = filter === 'done' ? true : filter === 'pending' ? false : undefined

  const { data, isLoading } = useQuery<{ data: Task[]; total: number }>({
    queryKey: ['tasks', filter],
    queryFn: () =>
      api.get('/tasks', { params: completed !== undefined ? { completed } : {} }).then((r) => r.data),
  })

  const complete = useMutation({
    mutationFn: (id: string) => api.put(`/tasks/${id}/complete`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const tasks = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${total} task${total !== 1 ? 's' : ''}`}
        action={
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        }
      />

      <div className="space-y-4">
        {showForm && <NewTaskForm onClose={() => setShowForm(false)} />}

        {/* Filter tabs */}
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/50 w-fit">
          {(['pending', 'all', 'done'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                filter === f
                  ? 'bg-white shadow-sm text-gray-900 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              )}
            >
              {f === 'pending' ? 'Active' : f === 'done' ? 'Completed' : 'All'}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-700">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner className="h-5 w-5 text-[#4F46E5]" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
              <ClipboardList className="h-10 w-10 opacity-30" />
              <p className="text-sm">
                {filter === 'pending' ? 'No active tasks.' : filter === 'done' ? 'No completed tasks.' : 'No tasks yet.'}
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskRow key={task.id} task={task} onComplete={(id) => complete.mutate(id)} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
