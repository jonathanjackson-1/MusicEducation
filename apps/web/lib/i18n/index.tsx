'use client';

import { createContext, useContext, useMemo } from 'react';

export type Locale = 'en' | 'es';

interface I18nContextValue {
  locale: Locale;
  t: (key: string, fallback?: string) => string;
}

const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    'nav.educator.calendar': 'Calendar',
    'nav.educator.assignments': 'Assignments',
    'nav.educator.students': 'Students',
    'nav.educator.settings': 'Settings',
    'nav.student.schedule': 'My Schedule',
    'nav.student.assignments': 'My Assignments',
    'nav.student.practice': 'Practice',
    'nav.student.streaks': 'Streaks & Badges',
    'nav.parent.children': 'Children',
    'nav.parent.bookings': 'Booking Requests',
    'nav.parent.invoices': 'Invoices'
  },
  es: {}
};

export const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  t: (key, fallback) => fallback ?? key
});

export interface I18nProviderProps {
  children: React.ReactNode;
  locale: Locale;
}

export const I18nProvider = ({ children, locale }: I18nProviderProps) => {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (key: string, fallback?: string) =>
        dictionaries[locale]?.[key] ?? fallback ?? key
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);

