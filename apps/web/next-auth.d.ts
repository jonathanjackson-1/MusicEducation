import 'next-auth';
import 'next-auth/jwt';

import type { SessionUser, UserRole } from '@/lib/api/client';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: SessionUser;
  }

  interface User extends SessionUser {
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
    studios?: SessionUser['studios'];
    activeStudioId?: string;
    accessToken?: string;
    avatarUrl?: string;
    name?: string;
  }
}

