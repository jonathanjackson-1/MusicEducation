import { EducatorStudentsView } from '@/components/educator/students-view';
import { ensureRole } from '@/lib/auth/guards';

export default async function EducatorStudentsPage() {
  const session = await ensureRole('educator');
  return <EducatorStudentsView studioId={session.user.activeStudioId} />;
}

