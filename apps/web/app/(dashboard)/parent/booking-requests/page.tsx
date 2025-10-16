import { ParentBookingRequestsView } from '@/components/parent/booking-requests-view';
import { ensureRole } from '@/lib/auth/guards';

export default async function ParentBookingRequestsPage() {
  const session = await ensureRole('parent');
  return <ParentBookingRequestsView studioId={session.user.activeStudioId} />;
}

