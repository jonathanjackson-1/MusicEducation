import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { createApiClient } from '@/lib/api/client';
import type { SessionUser } from '@/lib/api/client';

const apiClient = createApiClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        try {
          const { token, user } = await apiClient.login(
            credentials.email,
            credentials.password
          );

          return { ...user, accessToken: token } satisfies SessionUser & {
            accessToken: string;
          };
        } catch (error) {
          console.error('Login failed', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as SessionUser).role;
        token.studios = (user as SessionUser).studios;
        token.activeStudioId = (user as SessionUser).activeStudioId;
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.avatarUrl = (user as SessionUser).avatarUrl;
        token.name = (user as SessionUser).name;
      }

      if (trigger === 'update' && session?.activeStudioId) {
        token.activeStudioId = session.activeStudioId;
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...(session.user ?? {}),
        role: token.role,
        studios: token.studios,
        activeStudioId: token.activeStudioId,
        avatarUrl: token.avatarUrl,
        name: token.name ?? session.user?.name,
        email: session.user?.email ?? undefined
      } as SessionUser;

      session.accessToken = token.accessToken as string | undefined;
      return session;
    }
  },
  pages: {
    signIn: '/login'
  }
};

