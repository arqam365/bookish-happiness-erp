import { PageHeader } from '@/components/layout/PageHeader'
import { StudentTable } from './_components/StudentTable'
import { AdmissionModal } from './_components/AdmissionModal'

export default function StudentsPage() {
  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Manage student admissions, profiles, and enrollment."
        action={<AdmissionModal />}
      />
      <StudentTable />
    </div>
  )
}
