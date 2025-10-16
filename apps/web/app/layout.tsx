import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';

import { Providers } from './providers';
import { authOptions } from '@/auth.config';
import './globals.css';

export const metadata: Metadata = {
  title: 'Soundstudio',
  description: 'Learn, practice, and collaborate across every device.'
};

const resolveLocale = () => {
  const headerStore = headers();
  const acceptLanguage = headerStore.get('accept-language');
  const locale = acceptLanguage?.split(',')[0]?.split('-')[0];
  return (locale === 'es' ? 'es' : 'en') as const;
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const locale = resolveLocale();

  return (
    <html lang={locale}>
      <body className="bg-background text-foreground antialiased">
        <Providers session={session} locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
