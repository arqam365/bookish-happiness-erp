'use client'

import { useState, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Upload, Download, CheckCircle, XCircle, FileSpreadsheet, AlertTriangle, Layers } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

// ── constants ─────────────────────────────────────────────────────────────────

const REQUIRED = ['admissionNo', 'firstName', 'guardianFirstName', 'guardianPhone']

const ALL_COLS = [
  'admissionNo', 'firstName', 'lastName', 'dateOfBirth', 'gender',
  'phone', 'email', 'religion', 'nationality', 'bloodGroup',
  'city', 'address', 'category', 'rationCard',
  'guardianFirstName', 'guardianLastName', 'guardianRelationship', 'guardianPhone',
  'guardianWhatsApp', 'guardianEmail', 'guardianOccupation',
  'academicYear', 'className', 'section', 'rollNumber',
]

const FIELD_LABELS: Record<string, string> = {
  admissionNo: 'Admission No',
  firstName: 'First Name (auto-splits full name)',
  lastName: 'Last Name',
  dateOfBirth: 'Date of Birth',
  gender: 'Gender (MALE / FEMALE / OTHER)',
  phone: 'Phone',
  email: 'Email',
  religion: 'Religion',
  nationality: 'Nationality',
  bloodGroup: 'Blood Group',
  city: 'City',
  address: 'Address',
  category: 'Category',
  rationCard: 'Ration Card',
  guardianFirstName: 'Guardian Name (auto-splits full name)',
  guardianLastName: 'Guardian Last Name',
  guardianRelationship: 'Guardian Relationship',
  guardianPhone: 'Guardian Phone',
  guardianWhatsApp: 'Guardian WhatsApp',
  guardianEmail: 'Guardian Email',
  guardianOccupation: 'Guardian Occupation',
  academicYear: 'Academic Year',
  className: 'Class',
  section: 'Section',
  rollNumber: 'Roll Number',
}

const CHUNK_SIZE = 20

// ── types ─────────────────────────────────────────────────────────────────────

type Row = Record<string, string>
type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'results'
type ImportResult = { row: number; admissionNo: string; status: 'success' | 'error'; message?: string }

// ── helpers ───────────────────────────────────────────────────────────────────

function parseDate(val: string): string {
  if (!val) return val
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.split('T')[0]
  const m = val.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  const d = new Date(val)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return val
}

function validate(row: Row): string[] {
  const errs: string[] = []
  for (const col of REQUIRED) {
    if (!row[col]?.trim()) errs.push(`${col} required`)
  }
  if (row.gender && !['MALE', 'FEMALE', 'OTHER'].includes(row.gender)) {
    errs.push('gender must be MALE / FEMALE / OTHER')
  }
  if (row.dateOfBirth && isNaN(Date.parse(row.dateOfBirth))) {
    errs.push('dateOfBirth: unrecognized format')
  }
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errs.push('email invalid')
  }
  return errs
}

function autoDetect(headers: string[]): Record<string, string> {
  const lc = (s: string) => s.toLowerCase()
  const find = (...kw: string[]) => headers.find(h => kw.some(k => lc(h).includes(k))) ?? ''
  return {
    admissionNo:         find('admission'),
    firstName:           find('student name', 'first name', 'firstname'),
    lastName:            find('last name', 'lastname', 'surname'),
    dateOfBirth:         find('dob', 'date of birth', 'birth'),
    gender:              find('gender'),
    phone:               find('mobile no', 'phone no', 'mobile', 'phone'),
    email:               find('email'),
    religion:            find('religion'),
    nationality:         find('nationality'),
    bloodGroup:          find('blood'),
    city:                find('city'),
    address:             find('address'),
    category:            find('category'),
    rationCard:          find('ration'),
    guardianFirstName:   find('guardian name', 'guardian first', 'father name', 'parent name'),
    guardianLastName:    find('guardian last', 'guardian surname'),
    guardianRelationship:find('relationship', 'relation'),
    guardianPhone:       find('alternate no', 'guardian phone', 'guardian mobile'),
    guardianWhatsApp:    find('whatsapp'),
    guardianEmail:       find('guardian email'),
    guardianOccupation:  find('occupation'),
    academicYear:        find('batch', 'academic year', 'session'),
    className:           find('class'),
    section:             find('section'),
    rollNumber:          find('roll'),
  }
}

function applyMapping(rawRows: Row[], colMap: Record<string, string>, defaults: Record<string, string>): Row[] {
  const hasLastName = !!colMap.lastName
  const hasGuardianLastName = !!colMap.guardianLastName
  return rawRows.map(raw => {
    const row: Row = {}
    for (const [field, srcCol] of Object.entries(colMap)) {
      if (!srcCol) continue
      let val = String(raw[srcCol] ?? '').trim()
      if (!val) continue
      if (field === 'dateOfBirth') val = parseDate(val)
      if (field === 'firstName' && !hasLastName) {
        const parts = val.split(/\s+/)
        row.firstName = parts[0]
        if (parts.length > 1) row.lastName = parts.slice(1).join(' ')
      } else if (field === 'guardianFirstName' && !hasGuardianLastName) {
        const parts = val.split(/\s+/)
        row.guardianFirstName = parts[0]
        if (parts.length > 1) row.guardianLastName = parts.slice(1).join(' ')
      } else {
        row[field] = val
      }
    }
    for (const [field, def] of Object.entries(defaults)) {
      if (def && !row[field]) row[field] = def
    }
    if (row.gender) row.gender = row.gender.toUpperCase()
    return row
  })
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
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

function downloadFailedRows(results: ImportResult[], rows: Row[]) {
  const rowMap = new Map(rows.map(r => [r.admissionNo, r]))
  const failed = results
    .filter(r => r.status === 'error')
    .map(r => ({ ...rowMap.get(r.admissionNo), _error: r.message }))
  const ws = XLSX.utils.json_to_sheet(failed)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Failed rows')
  XLSX.writeFile(wb, 'import-failures.xlsx')
}

// ── component ─────────────────────────────────────────────────────────────────

export function BulkImportModal() {
  const [open, setOpen]               = useState(false)
  const [step, setStep]               = useState<Step>('upload')

  // file / sheet
  const [workbook, setWorkbook]       = useState<XLSX.WorkBook | null>(null)
  const [sheetNames, setSheetNames]   = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState('')

  // mapping
  const [fileHeaders, setFileHeaders] = useState<string[]>([])
  const [rawRows, setRawRows]         = useState<Row[]>([])
  const [colMap, setColMap]           = useState<Record<string, string>>({})
  const [defaults, setDefaults]       = useState<Record<string, string>>({})

  // preview
  const [rows, setRows]               = useState<Row[]>([])
  const [errors, setErrors]           = useState<string[][]>([])
  const [dupesInFile, setDupesInFile] = useState<Set<number>>(new Set())

  // import progress
  const [progress, setProgress]       = useState({ done: 0, total: 0 })
  const [results, setResults]         = useState<ImportResult[]>([])
  const abortRef                      = useRef(false)

  const [parseError, setParseError]   = useState('')
  const qc = useQueryClient()

  // sample values for mapping hints (first 2 non-empty values per header)
  const sampleValues = useMemo(() => {
    const map: Record<string, string> = {}
    for (const h of fileHeaders) {
      const vals = rawRows.map(r => String(r[h] ?? '').trim()).filter(Boolean).slice(0, 2)
      map[h] = vals.join(', ')
    }
    return map
  }, [fileHeaders, rawRows])

  function reset() {
    setStep('upload'); setWorkbook(null); setSheetNames([]); setSelectedSheet('')
    setFileHeaders([]); setRawRows([]); setColMap({}); setDefaults({})
    setRows([]); setErrors([]); setDupesInFile(new Set())
    setProgress({ done: 0, total: 0 }); setResults([])
    setParseError(''); abortRef.current = false
  }

  function loadSheet(wb: XLSX.WorkBook, name: string) {
    const raw = XLSX.utils.sheet_to_json<Row>(wb.Sheets[name], { defval: '', raw: false })
    if (!raw.length) { setParseError('Sheet is empty'); return }
    const headers = Object.keys(raw[0])
    setFileHeaders(headers); setRawRows(raw)
    setColMap(autoDetect(headers)); setDefaults({})
    setStep('mapping')
  }

  async function handleFile(file: File) {
    setParseError('')
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', raw: false })
      setWorkbook(wb)
      if (wb.SheetNames.length > 1) {
        setSheetNames(wb.SheetNames); setSelectedSheet(wb.SheetNames[0])
      } else {
        loadSheet(wb, wb.SheetNames[0])
      }
    } catch {
      setParseError('Failed to parse file. Use a valid .csv or .xlsx.')
    }
  }

  function handleApplyMapping() {
    const mapped = applyMapping(rawRows, colMap, defaults)
    // detect duplicates within the file
    const seen = new Map<string, number>()
    const dupes = new Set<number>()
    mapped.forEach((r, i) => {
      const key = r.admissionNo?.trim()
      if (!key) return
      if (seen.has(key)) { dupes.add(i); dupes.add(seen.get(key)!) }
      else seen.set(key, i)
    })
    setRows(mapped); setErrors(mapped.map(validate)); setDupesInFile(dupes)
    setStep('preview')
  }

  const importMutation = useMutation({
    mutationFn: async () => {
      const valid = rows.filter((_, i) => !errors[i]?.length && !dupesInFile.has(i))
      const chunks = chunkArray(valid, CHUNK_SIZE)
      setProgress({ done: 0, total: valid.length }); setResults([])
      abortRef.current = false
      let acc: ImportResult[] = []
      for (const ch of chunks) {
        if (abortRef.current) break
        const { data } = await api.post<ImportResult[]>('/students/bulk-import', { rows: ch })
        acc = [...acc, ...data]
        setResults([...acc])
        setProgress({ done: acc.length, total: valid.length })
      }
      return acc
    },
    onSuccess: () => { setStep('results'); qc.invalidateQueries({ queryKey: ['students'] }) },
    onError: () => setStep('preview'),
  })

  // counts
  const validCount     = errors.filter((e, i) => !e.length && !dupesInFile.has(i)).length
  const errorOnlyCount = errors.filter((e, i) => e.length > 0 && !dupesInFile.has(i)).length
  const dupeCount      = dupesInFile.size
  const successCount   = results.filter(r => r.status === 'success').length
  const failCount      = results.filter(r => r.status === 'error').length
  const pct            = progress.total ? Math.round((progress.done / progress.total) * 100) : 0

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
        description={
          step === 'upload'    ? 'Upload a .csv or .xlsx file' :
          step === 'mapping'   ? `${rawRows.length} rows detected — map columns to fields` :
          step === 'preview'   ? 'Review before importing' :
          step === 'importing' ? 'Importing…' :
                                 'Import complete'
        }
        className="max-w-2xl"
      >
        <div className="flex-1 min-h-0 overflow-y-auto">

          {/* ── Upload / Sheet picker ── */}
          {step === 'upload' && (
            <div className="space-y-4">
              {sheetNames.length === 0 ? (
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
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-3 dark:bg-indigo-950">
                    <Layers className="h-4 w-4 flex-shrink-0 text-indigo-500" />
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                      Multiple sheets found. Pick one to import.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {sheetNames.map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setSelectedSheet(name)}
                        className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm transition ${
                          selectedSheet === name
                            ? 'border-[#4F46E5] bg-indigo-50 dark:bg-indigo-950'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                        }`}
                      >
                        <FileSpreadsheet className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-200">{name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {parseError && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{parseError}</p>
              )}

              {sheetNames.length === 0 && (
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Need the template?</p>
                    <p className="text-xs text-gray-500">All {ALL_COLS.length} columns with an example row</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={downloadTemplate}>
                    <Download className="h-4 w-4" /> Template
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Column Mapping ── */}
          {step === 'mapping' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fields marked <span className="text-red-500">*</span> are required.
                Mapping a full name column to <em>First Name</em> or <em>Guardian Name</em> auto-splits on first space.
                Use <em>Default if empty</em> for fields missing in your file (e.g. set Relationship → <em>Guardian</em>).
              </p>
              <div className="max-h-[400px] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="w-[36%] px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Field</th>
                      <th className="w-[37%] px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Your column</th>
                      <th className="w-[27%] px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Default if empty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {ALL_COLS.map(field => {
                      const req = REQUIRED.includes(field)
                      const src = colMap[field] ?? ''
                      return (
                        <tr key={field} className={req ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''}>
                          <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200">
                            {FIELD_LABELS[field]}{req && <span className="ml-1 text-red-500">*</span>}
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={src}
                              onChange={e => setColMap(m => ({ ...m, [field]: e.target.value }))}
                              className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            >
                              <option value="">— skip —</option>
                              {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            {src && sampleValues[src] && (
                              <p className="mt-0.5 truncate text-[10px] text-gray-400" title={sampleValues[src]}>
                                e.g. {sampleValues[src]}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              placeholder="default value…"
                              value={defaults[field] ?? ''}
                              onChange={e => setDefaults(d => ({ ...d, [field]: e.target.value }))}
                              className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs placeholder:text-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-600"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Preview ── */}
          {step === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle className="h-3.5 w-3.5" /> {validCount} ready
                </span>
                {errorOnlyCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-red-700 dark:bg-red-950 dark:text-red-300">
                    <XCircle className="h-3.5 w-3.5" /> {errorOnlyCount} invalid
                  </span>
                )}
                {dupeCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" /> {dupeCount} duplicate admission no
                  </span>
                )}
                <span className="ml-auto text-xs text-gray-400">{rows.length} total</span>
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
                    {rows.map((row, i) => {
                      const isDupe  = dupesInFile.has(i)
                      const rowErrs = errors[i] ?? []
                      const invalid = rowErrs.length > 0 && !isDupe
                      return (
                        <tr
                          key={i}
                          className={isDupe ? 'bg-amber-50/40 dark:bg-amber-950/20' : invalid ? 'bg-red-50/40 dark:bg-red-950/20' : ''}
                        >
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
                            {isDupe  ? <span className="text-amber-500">⚠ duplicate</span> :
                             invalid ? <span className="text-red-500" title={rowErrs.join('; ')}>✗ {rowErrs[0]}{rowErrs.length > 1 ? ` +${rowErrs.length - 1}` : ''}</span> :
                                       <span className="text-emerald-600 dark:text-emerald-400">✓</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {importMutation.isError && (
                <p className="text-sm text-red-500">
                  {(importMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Import failed'}
                </p>
              )}
            </div>
          )}

          {/* ── Importing — progress ── */}
          {step === 'importing' && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Importing students…</span>
                  <span className="font-medium">{pct}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-[#4F46E5] transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">{progress.done} of {progress.total} processed</p>
              </div>
              {results.length > 0 && (
                <div className="flex gap-4 text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="mr-1 inline h-3.5 w-3.5" />{results.filter(r => r.status === 'success').length} imported
                  </span>
                  {results.filter(r => r.status === 'error').length > 0 && (
                    <span className="text-red-500">
                      <XCircle className="mr-1 inline h-3.5 w-3.5" />{results.filter(r => r.status === 'error').length} failed
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Results ── */}
          {step === 'results' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle className="h-3.5 w-3.5" /> {successCount} imported
                </span>
                {failCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-red-700 dark:bg-red-950 dark:text-red-300">
                    <XCircle className="h-3.5 w-3.5" /> {failCount} failed
                  </span>
                )}
                {failCount > 0 && (
                  <button
                    type="button"
                    onClick={() => downloadFailedRows(results, rows)}
                    className="ml-auto flex items-center gap-1.5 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    <Download className="h-3.5 w-3.5" /> Download failures
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {['Row', 'Adm No', 'Name', 'Result'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {results.map((r, i) => {
                      const src = rows.find(row => row.admissionNo === r.admissionNo)
                      return (
                        <tr key={i} className={r.status === 'error' ? 'bg-red-50/40 dark:bg-red-950/20' : ''}>
                          <td className="px-3 py-2 text-gray-400">{r.row}</td>
                          <td className="px-3 py-2 font-mono text-gray-700 dark:text-gray-300">{r.admissionNo}</td>
                          <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                            {src ? [src.firstName, src.lastName].filter(Boolean).join(' ') : '—'}
                          </td>
                          <td className="px-3 py-2">
                            {r.status === 'success'
                              ? <span className="text-emerald-600 dark:text-emerald-400">✓ Imported</span>
                              : <span className="text-red-500" title={r.message}>✗ {r.message}</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 flex justify-between gap-2 pt-3">
          {step === 'upload' && sheetNames.length === 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          )}
          {step === 'upload' && sheetNames.length > 0 && (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setSheetNames([]); setWorkbook(null) }}>
                Choose different file
              </Button>
              <Button type="button" size="sm" onClick={() => workbook && loadSheet(workbook, selectedSheet)}>
                Use &quot;{selectedSheet}&quot;
              </Button>
            </>
          )}
          {step === 'mapping' && (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep('upload')}>Back</Button>
              <Button type="button" size="sm" onClick={handleApplyMapping}>
                Preview {rawRows.length} rows
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep('mapping')}>Back</Button>
              <Button
                type="button"
                size="sm"
                disabled={validCount === 0}
                onClick={() => { setStep('importing'); importMutation.mutate() }}
              >
                Import {validCount} student{validCount !== 1 ? 's' : ''}
              </Button>
            </>
          )}
          {step === 'importing' && (
            <Button type="button" variant="ghost" size="sm" onClick={() => { abortRef.current = true }}>
              Cancel
            </Button>
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
