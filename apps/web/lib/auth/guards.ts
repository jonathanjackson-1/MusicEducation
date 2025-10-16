import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/auth.config';
import type { SessionUser, UserRole } from '@/lib/api/client';

export const ensureRole = async (allowed: UserRole | UserRole[]) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];
  const user = session.user as SessionUser | undefined;

  if (!user || !allowedRoles.includes(user.role)) {
    redirect('/forbidden');
  }

  return session;
};

export const ensureAuthenticated = async () => {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }
  return session;
};

