import { StudentPracticeView } from '@/components/student/practice-view';
import { ensureRole } from '@/lib/auth/guards';

export default async function StudentPracticePage() {
  const session = await ensureRole('student');
  return <StudentPracticeView studioId={session.user.activeStudioId} />;
}

