import { PageHeader } from '@/components/layout/PageHeader'
import { StudentTable } from './_components/StudentTable'
import { AdmissionModal } from './_components/AdmissionModal'
import { BulkImportModal } from './_components/BulkImportModal'

export default function StudentsPage() {
  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Manage student admissions, profiles, and enrollment."
        action={<div className="flex items-center gap-2"><BulkImportModal /><AdmissionModal /></div>}
      />
      <StudentTable />
    </div>
  )
}
