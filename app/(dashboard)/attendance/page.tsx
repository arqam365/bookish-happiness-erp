'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { CheckCircle2, XCircle, Clock3, FileCheck2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Select, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAttendanceSocket } from '@/hooks/useSocket'
import api from '@/lib/api'

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: React.ReactNode; active: string; inactive: string }> = {
  PRESENT: {
    label: 'Present',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    active: 'bg-emerald-500 text-white border-emerald-500 shadow-sm',
    inactive: 'bg-white text-gray-400 border-gray-200 hover:border-emerald-400 hover:text-emerald-500 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-emerald-500',
  },
  ABSENT: {
    label: 'Absent',
    icon: <XCircle className="h-3.5 w-3.5" />,
    active: 'bg-rose-500 text-white border-rose-500 shadow-sm',
    inactive: 'bg-white text-gray-400 border-gray-200 hover:border-rose-400 hover:text-rose-500 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-rose-500',
  },
  LATE: {
    label: 'Late',
    icon: <Clock3 className="h-3.5 w-3.5" />,
    active: 'bg-amber-400 text-white border-amber-400 shadow-sm',
    inactive: 'bg-white text-gray-400 border-gray-200 hover:border-amber-400 hover:text-amber-500 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-amber-400',
  },
  EXCUSED: {
    label: 'Excused',
    icon: <FileCheck2 className="h-3.5 w-3.5" />,
    active: 'bg-indigo-400 text-white border-indigo-400 shadow-sm',
    inactive: 'bg-white text-gray-400 border-gray-200 hover:border-indigo-400 hover:text-indigo-500 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-indigo-400',
  },
}

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-emerald-500 text-white',
  ABSENT: 'bg-rose-500 text-white',
  LATE: 'bg-amber-400 text-white',
  EXCUSED: 'bg-indigo-400 text-white',
}

interface ClassItem { id: string; name: string; sections: Array<{ id: string; name: string }> }
interface Student { id: string; firstName: string; lastName: string; admissionNo: string }
interface AttendanceRecord { studentId: string; status: AttendanceStatus }
interface MonthlyRow {
  student: { id: string; firstName: string; lastName: string; admissionNo: string }
  days: Record<string, AttendanceStatus>
}

export default function AttendancePage() {
  const today = dayjs().format('YYYY-MM-DD')
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [selectedDate, setSelectedDate] = useState(today)
  const [markMap, setMarkMap] = useState<Record<string, AttendanceStatus>>({})
  const [reportMonth, setReportMonth] = useState(dayjs().month() + 1)
  const [reportYear, setReportYear] = useState(dayjs().year())
  const qc = useQueryClient()

  const handleAttendanceUpdate = useCallback((data: { date: string; sectionId: string }) => {
    qc.invalidateQueries({ queryKey: ['attendance-section', data.sectionId, data.date] })
  }, [qc])
  useAttendanceSocket(handleAttendanceUpdate)

  const { data: classes = [] } = useQuery<ClassItem[]>({
    queryKey: ['settings-classes'],
    queryFn: () => api.get('/settings/classes').then((r) => r.data),
  })
  const selectedClass = classes.find((c) => c.id === classId)

  const { data: studentsRes, isLoading: studentsLoading } = useQuery<{ data: Student[] }>({
    queryKey: ['students', { sectionId, limit: 200 }],
    queryFn: () => api.get('/students', { params: { sectionId, limit: 200 } }).then((r) => r.data),
    enabled: !!sectionId,
  })
  const students = studentsRes?.data ?? []

  const { data: existingAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance-section', sectionId, selectedDate],
    queryFn: () =>
      api.get('/attendance/section', { params: { sectionId, date: selectedDate } }).then((r) => r.data),
    enabled: !!sectionId && !!selectedDate,
  })

  useEffect(() => {
    if (!existingAttendance) return
    const map: Record<string, AttendanceStatus> = {}
    existingAttendance.forEach((r) => { map[r.studentId] = r.status })
    if (Object.keys(map).length > 0) setMarkMap(map)
  }, [existingAttendance])

  const { data: monthlyReport = [], isLoading: reportLoading } = useQuery<MonthlyRow[]>({
    queryKey: ['attendance-monthly', sectionId, reportMonth, reportYear],
    queryFn: () =>
      api.get('/attendance/monthly-report', { params: { sectionId, month: reportMonth, year: reportYear } }).then((r) => r.data),
    enabled: !!sectionId,
  })

  const saveAttendance = useMutation({
    mutationFn: () =>
      api.post('/attendance/mark', {
        date: selectedDate,
        sectionId,
        records: students.map((s) => ({ studentId: s.id, status: markMap[s.id] ?? 'PRESENT' })),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance-section', sectionId, selectedDate] }),
  })


  function setAll(status: AttendanceStatus) {
    const map: Record<string, AttendanceStatus> = {}
    students.forEach((s) => { map[s.id] = status })
    setMarkMap(map)
  }

  const totalDays = new Date(reportYear, reportMonth, 0).getDate()
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Mark daily attendance and view monthly reports." />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px]">
          <Select label="Class" value={classId} onValueChange={(v) => { setClassId(v); setSectionId(''); setMarkMap({}) }} placeholder="Select class">
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </Select>
        </div>
        {selectedClass && (
          <div className="min-w-[180px]">
            <Select label="Section" value={sectionId} onValueChange={(v) => { setSectionId(v); setMarkMap({}) }} placeholder="Select section">
              {selectedClass.sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </Select>
          </div>
        )}
      </div>

      {!sectionId ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-400">Select a class and section to get started.</p>
        </div>
      ) : (
        <Tabs defaultValue="mark">
          <TabsList>
            <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
            <TabsTrigger value="report">Monthly Report</TabsTrigger>
          </TabsList>

          <TabsContent value="mark">
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  max={today}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex gap-2 pb-0.5">
                <Button variant="outline" size="sm" onClick={() => setAll('PRESENT')}>All present</Button>
                <Button variant="outline" size="sm" onClick={() => setAll('ABSENT')}>All absent</Button>
              </div>
              <div className="ml-auto pb-0.5">
                <Button size="sm" loading={saveAttendance.isPending} disabled={students.length === 0} onClick={() => saveAttendance.mutate()}>
                  Save attendance
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              {studentsLoading ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <div className="h-4 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                      <div className="h-7 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700" />
                    </div>
                  ))}
                </div>
              ) : students.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-400">No students in this section.</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {students.map((s, idx) => {
                    const status = markMap[s.id] ?? 'PRESENT'
                    return (
                      <div key={s.id} className="flex items-center justify-between px-4 py-3 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.firstName} {s.lastName}</p>
                            <p className="text-xs text-gray-400">{s.admissionNo}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((st) => {
                            const cfg = STATUS_CONFIG[st]
                            const isActive = status === st
                            return (
                              <button
                                key={st}
                                onClick={() => setMarkMap((prev) => ({ ...prev, [s.id]: st }))}
                                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${isActive ? cfg.active : cfg.inactive}`}
                                title={cfg.label}
                              >
                                {cfg.icon}
                                <span className="hidden sm:inline">{cfg.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="report">
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div className="min-w-[130px]">
                <Select label="Month" value={String(reportMonth)} onValueChange={(v) => setReportMonth(Number(v))} placeholder="Month">
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="min-w-[110px]">
                <Select label="Year" value={String(reportYear)} onValueChange={(v) => setReportYear(Number(v))} placeholder="Year">
                  {[dayjs().year() - 1, dayjs().year(), dayjs().year() + 1].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {reportLoading ? (
              <div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            ) : monthlyReport.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm text-gray-400">No attendance records for this period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                      <th className="sticky left-0 z-10 bg-gray-50 px-4 py-2.5 font-semibold text-gray-500 dark:bg-gray-800 whitespace-nowrap">Student</th>
                      {days.map((d) => (
                        <th key={d} className="min-w-[26px] px-1 py-2.5 text-center font-semibold text-gray-500">{d}</th>
                      ))}
                      <th className="px-3 py-2.5 text-center font-semibold text-emerald-600">P</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-rose-500">A</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {monthlyReport.map((row) => {
                      const vals = Object.values(row.days)
                      const present = vals.filter((s) => s === 'PRESENT').length
                      const absent = vals.filter((s) => s === 'ABSENT').length
                      return (
                        <tr key={row.student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                          <td className="sticky left-0 z-10 bg-white px-4 py-2 dark:bg-gray-900 whitespace-nowrap">
                            <p className="font-medium text-gray-900 dark:text-white">{row.student.firstName} {row.student.lastName}</p>
                            <p className="text-gray-400">{row.student.admissionNo}</p>
                          </td>
                          {days.map((d) => {
                            const s = row.days[String(d)] as AttendanceStatus | undefined
                            return (
                              <td key={d} className="px-1 py-2 text-center">
                                {s ? (
                                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${STATUS_STYLES[s]}`} title={s}>
                                    {s[0]}
                                  </span>
                                ) : (
                                  <span className="text-gray-200 dark:text-gray-700">·</span>
                                )}
                              </td>
                            )
                          })}
                          <td className="px-3 py-2 text-center font-semibold text-emerald-600">{present}</td>
                          <td className="px-3 py-2 text-center font-semibold text-rose-500">{absent}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
