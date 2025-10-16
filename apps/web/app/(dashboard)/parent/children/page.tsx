import { ParentChildrenView } from '@/components/parent/children-view';
import { ensureRole } from '@/lib/auth/guards';

export default async function ParentChildrenPage() {
  const session = await ensureRole('parent');
  return <ParentChildrenView studioId={session.user.activeStudioId} />;
}

