import { StudentStreaksView } from '@/components/student/streaks-view';
import { ensureRole } from '@/lib/auth/guards';

export default async function StudentStreaksPage() {
  const session = await ensureRole('student');
  return <StudentStreaksView studioId={session.user.activeStudioId} />;
}

