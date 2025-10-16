'use client';

import { ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

import { I18nProvider, type Locale } from '@/lib/i18n';
import { SentryErrorBoundary } from '@/components/observability/SentryErrorBoundary';

interface ProvidersProps {
  children: ReactNode;
  session: Session | null;
  locale: Locale;
}

export const Providers = ({ children, session, locale }: ProvidersProps) => {
  const [queryClient] = useState(() => new QueryClient());
  const memoizedSession = useMemo(() => session, [session]);

  return (
    <SessionProvider session={memoizedSession}>
      <SentryErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <I18nProvider locale={locale}>{children}</I18nProvider>
        </QueryClientProvider>
      </SentryErrorBoundary>
    </SessionProvider>
  );
};

