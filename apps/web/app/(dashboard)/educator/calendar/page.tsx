import { EducatorCalendarView } from '@/components/educator/calendar-view';
import { ensureRole } from '@/lib/auth/guards';

export default async function EducatorCalendarPage() {
  const session = await ensureRole('educator');
  return <EducatorCalendarView studioId={session.user.activeStudioId} />;
}

