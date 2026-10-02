'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Upload, Download, CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

// ── constants ─────────────────────────────────────────────────────────────────

const REQUIRED = ['admissionNo', 'firstName', 'guardianFirstName', 'guardianLastName', 'guardianRelationship', 'guardianPhone']

const ALL_COLS = [
  'admissionNo', 'firstName', 'lastName', 'dateOfBirth', 'gender',
  'phone', 'email', 'religion', 'nationality', 'bloodGroup',
  'city', 'address', 'category', 'rationCard',
  'guardianFirstName', 'guardianLastName', 'guardianRelationship', 'guardianPhone',
  'guardianWhatsApp', 'guardianEmail', 'guardianOccupation',
  'academicYear', 'className', 'section', 'rollNumber',
]

// ── types ─────────────────────────────────────────────────────────────────────

type Row = Record<string, string>
type ImportResult = { row: number; admissionNo: string; status: 'success' | 'error'; message?: string }

// ── helpers ───────────────────────────────────────────────────────────────────

function validate(row: Row): string[] {
  const errs: string[] = []
  for (const col of REQUIRED) {
    if (!row[col]?.trim()) errs.push(`${col} required`)
  }
  if (row.gender && !['MALE', 'FEMALE', 'OTHER'].includes(row.gender)) {
    errs.push('gender: MALE/FEMALE/OTHER')
  }
  if (row.dateOfBirth && isNaN(Date.parse(row.dateOfBirth))) {
    errs.push('dateOfBirth: YYYY-MM-DD')
  }
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errs.push('email invalid')
  }
  return errs
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ALL_COLS,
    ['ADM-001', 'Rahul', 'Kumar', '2010-03-15', 'MALE', '+919876543210', '', 'Hindu', 'India', 'A+', 'Delhi', '123 Main St', 'General', 'APL', 'Suresh', 'Kumar', 'Father', '+919876543210', '', '', 'Farmer', '2025-26', 'Class 5', 'A', '1'],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Students')
  XLSX.writeFile(wb, 'student-import-template.xlsx')
}

// ── component ─────────────────────────────────────────────────────────────────

export function BulkImportModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'upload' | 'preview' | 'results'>('upload')
  const [rows, setRows] = useState<Row[]>([])
  const [errors, setErrors] = useState<string[][]>([])
  const [results, setResults] = useState<ImportResult[]>([])
  const [parseError, setParseError] = useState('')
  const qc = useQueryClient()

  function reset() {
    setStep('upload')
    setRows([])
    setErrors([])
    setResults([])
    setParseError('')
  }

  async function handleFile(file: File) {
    setParseError('')
    try {
      const ab = await file.arrayBuffer()
      const wb = XLSX.read(ab, { type: 'array', raw: false })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json<Row>(ws, { defval: '', raw: false })

      if (raw.length === 0) { setParseError('File is empty'); return }

      const normalized = raw.map(r => {
        const row: Row = {}
        for (const [k, v] of Object.entries(r)) row[k.trim()] = String(v ?? '').trim()
        if (row.gender) row.gender = row.gender.toUpperCase()
        return row
      })

      const missing = REQUIRED.filter(c => !(c in normalized[0]))
      if (missing.length) {
        setParseError(`Missing columns: ${missing.join(', ')}. Download the template.`)
        return
      }

      setRows(normalized)
      setErrors(normalized.map(validate))
      setStep('preview')
    } catch {
      setParseError('Failed to parse file. Use a valid .csv or .xlsx.')
    }
  }

  const importMutation = useMutation({
    mutationFn: async () => {
      const payload = rows.filter((_, i) => !errors[i]?.length)
      const { data } = await api.post<ImportResult[]>('/students/bulk-import', { rows: payload })
      return data
    },
    onSuccess: (data) => {
      setResults(data)
      setStep('results')
      qc.invalidateQueries({ queryKey: ['students'] })
    },
  })

  const validCount = errors.filter(e => !e.length).length
  const invalidCount = rows.length - validCount
  const successCount = results.filter(r => r.status === 'success').length
  const failCount = results.filter(r => r.status === 'error').length

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <FileSpreadsheet className="h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>

      <DialogContent
        title="Bulk import students"
        description="Upload a .csv or .xlsx file to import multiple students at once"
        className="max-w-2xl"
      >
        <div className="flex-1 min-h-0 overflow-y-auto">

          {/* ── Upload ── */}
          {step === 'upload' && (
            <div className="space-y-4">
              <label
                htmlFor="bulk-file"
                className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 p-10 text-center cursor-pointer transition hover:border-[#4F46E5] hover:bg-indigo-50 dark:border-gray-700 dark:hover:border-[#4F46E5] dark:hover:bg-indigo-950"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Drop file here or click to browse</p>
                  <p className="mt-1 text-xs text-gray-500">Supports .csv and .xlsx</p>
                </div>
                <input id="bulk-file" type="file" accept=".csv,.xlsx,.xls" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </label>

              {parseError && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{parseError}</p>
              )}

              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Need the template?</p>
                  <p className="text-xs text-gray-500">All {ALL_COLS.length} columns with an example row</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4" /> Template
                </Button>
              </div>
            </div>
          )}

          {/* ── Preview ── */}
          {step === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle className="h-3.5 w-3.5" /> {validCount} valid
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-red-700 dark:bg-red-950 dark:text-red-300">
                    <XCircle className="h-3.5 w-3.5" /> {invalidCount} with errors (skipped)
                  </span>
                )}
                <span className="ml-auto text-xs text-gray-400">{rows.length} total rows</span>
              </div>

              <div className="max-h-72 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {['#', 'Adm No', 'Name', 'Guardian', 'Class / Section', 'Status'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rows.map((row, i) => (
                      <tr key={i} className={errors[i]?.length ? 'bg-red-50/40 dark:bg-red-950/20' : ''}>
                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2 font-mono text-gray-700 dark:text-gray-300">{row.admissionNo || '—'}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {[row.firstName, row.lastName].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                          {[row.guardianFirstName, row.guardianLastName].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                          {[row.className, row.section].filter(Boolean).join(' › ') || '—'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {errors[i]?.length ? (
                            <span className="text-red-500" title={errors[i].join('; ')}>
                              ✗ {errors[i][0]}{errors[i].length > 1 ? ` +${errors[i].length - 1}` : ''}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {importMutation.isError && (
                <p className="text-sm text-red-500">
                  {(importMutation.error as any)?.response?.data?.message ?? 'Import failed'}
                </p>
              )}
            </div>
          )}

          {/* ── Results ── */}
          {step === 'results' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle className="h-3.5 w-3.5" /> {successCount} imported
                </span>
                {failCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-red-700 dark:bg-red-950 dark:text-red-300">
                    <XCircle className="h-3.5 w-3.5" /> {failCount} failed
                  </span>
                )}
              </div>

              <div className="max-h-72 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {['Row', 'Adm No', 'Result'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {results.map((r, i) => (
                      <tr key={i} className={r.status === 'error' ? 'bg-red-50/40 dark:bg-red-950/20' : ''}>
                        <td className="px-3 py-2 text-gray-400">{r.row}</td>
                        <td className="px-3 py-2 font-mono text-gray-700 dark:text-gray-300">{r.admissionNo}</td>
                        <td className="px-3 py-2">
                          {r.status === 'success'
                            ? <span className="text-emerald-600 dark:text-emerald-400">✓ Imported</span>
                            : <span className="text-red-500">✗ {r.message}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 flex justify-between gap-2 pt-3">
          {step === 'upload' && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          )}
          {step === 'preview' && (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep('upload')}>Back</Button>
              <Button
                type="button"
                size="sm"
                disabled={validCount === 0}
                loading={importMutation.isPending}
                onClick={() => importMutation.mutate()}
              >
                Import {validCount} student{validCount !== 1 ? 's' : ''}
              </Button>
            </>
          )}
          {step === 'results' && (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={reset}>Import more</Button>
              <Button type="button" size="sm" onClick={() => { reset(); setOpen(false) }}>Done</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
