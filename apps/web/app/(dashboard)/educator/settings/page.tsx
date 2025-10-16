import { EducatorSettingsView } from '@/components/educator/settings-view';
import { ensureRole } from '@/lib/auth/guards';

export default async function EducatorSettingsPage() {
  await ensureRole('educator');
  return <EducatorSettingsView />;
}

