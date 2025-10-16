import { StudentScheduleView } from '@/components/student/schedule-view';
import { ensureRole } from '@/lib/auth/guards';

export default async function StudentSchedulePage() {
  const session = await ensureRole('student');
  return <StudentScheduleView studioId={session.user.activeStudioId} />;
}

