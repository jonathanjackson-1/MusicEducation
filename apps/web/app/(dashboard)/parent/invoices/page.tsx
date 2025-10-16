import { ParentInvoicesView } from '@/components/parent/invoices-view';
import { ensureRole } from '@/lib/auth/guards';

export default async function ParentInvoicesPage() {
  const session = await ensureRole('parent');
  return <ParentInvoicesView studioId={session.user.activeStudioId} />;
}

