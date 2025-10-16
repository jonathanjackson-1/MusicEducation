import { EducatorAssignmentsView } from '@/components/educator/assignments-view';
import { ensureRole } from '@/lib/auth/guards';

export default async function EducatorAssignmentsPage() {
  const session = await ensureRole('educator');
  return <EducatorAssignmentsView studioId={session.user.activeStudioId} />;
}

