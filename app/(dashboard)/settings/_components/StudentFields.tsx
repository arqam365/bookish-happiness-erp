'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectItem } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'

type FieldType = 'text' | 'number' | 'date' | 'dropdown' | 'textarea'

interface StudentField {
  id: string
  label: string
  fieldType: FieldType
  required: boolean
  options?: string[]
  order: number
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'textarea', label: 'Long Text' },
]

const PRESET_FIELDS = [
  'Passport Number',
  'Aadhar Number',
  'Guardian Occupation',
  'Sponsor Name',
  'Previous School',
  'Hifz Status',
  'Medical Notes',
  'Transport Route',
  'Hostel Block',
]

export function StudentFields() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [fieldType, setFieldType] = useState<FieldType>('text')
  const [required, setRequired] = useState(false)
  const [options, setOptions] = useState('')

  const { data: fields = [], isLoading } = useQuery<StudentField[]>({
    queryKey: ['settings-student-fields'],
    queryFn: () => api.get('/settings/student-fields').then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: () => api.post('/settings/student-fields', {
      label,
      fieldType,
      required,
      options: fieldType === 'dropdown' ? options.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-student-fields'] })
      setShowForm(false); setLabel(''); setFieldType('text'); setRequired(false); setOptions('')
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/settings/student-fields/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-student-fields'] }),
  })

  const toggleRequired = useMutation({
    mutationFn: ({ id, required }: { id: string; required: boolean }) =>
      api.patch(`/settings/student-fields/${id}`, { required }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-student-fields'] }),
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Student Fields</CardTitle>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Add extra fields to the student admission form. Shown as an additional step.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-3.5 w-3.5" />Add field
            </Button>
          </div>
        </CardHeader>

        {showForm && (
          <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4 space-y-3 dark:border-indigo-900 dark:bg-indigo-950/30">
            <div className="flex flex-wrap gap-2 mb-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 w-full">Quick add:</p>
              {PRESET_FIELDS.map((p) => (
                <button
                  key={p}
                  onClick={() => setLabel(p)}
                  className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Field label *"
                placeholder="e.g. Passport Number"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <Select
                label="Field type *"
                value={fieldType}
                onValueChange={(v) => setFieldType(v as FieldType)}
                placeholder="Select type"
              >
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </Select>
            </div>
            {fieldType === 'dropdown' && (
              <Input
                label="Options (comma-separated)"
                placeholder="Option 1, Option 2, Option 3"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
              />
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="field-required"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5]"
              />
              <label htmlFor="field-required" className="text-sm text-gray-700 dark:text-gray-200">Required field</label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" loading={create.isPending} disabled={!label} onClick={() => create.mutate()}>Add field</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div>
        ) : fields.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No custom fields yet. Add fields to capture extra student data.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {fields.map((f) => (
              <div key={f.id} className="flex items-center gap-3 py-3">
                <GripVertical className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600 cursor-grab" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{f.label}</p>
                    <Badge variant="default">{FIELD_TYPES.find((t) => t.value === f.fieldType)?.label ?? f.fieldType}</Badge>
                    {f.required && <Badge variant="danger">Required</Badge>}
                  </div>
                  {f.options && f.options.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{f.options.join(', ')}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleRequired.mutate({ id: f.id, required: !f.required })}
                    className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {f.required ? 'Make optional' : 'Make required'}
                  </button>
                  <button
                    onClick={() => remove.mutate(f.id)}
                    className="rounded p-1 text-gray-300 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 transition-colors"
                    title="Remove field"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
