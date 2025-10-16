import { StudentAssignmentsView } from '@/components/student/assignments-view';
import { ensureRole } from '@/lib/auth/guards';

export default async function StudentAssignmentsPage() {
  const session = await ensureRole('student');
  return <StudentAssignmentsView studioId={session.user.activeStudioId} />;
}

