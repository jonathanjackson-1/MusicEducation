'use client';

import { PropsWithChildren, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

let isInitialized = false;

type ErrorFallbackRenderProps = {
  error: Error;
  resetError: () => void;
};

type SentryErrorBoundaryProps = PropsWithChildren<{
  fallback?:
    | ReactNode
    | ((props: ErrorFallbackRenderProps) => ReactNode);
}>;

const DefaultErrorFallback = ({ error, resetError }: ErrorFallbackRenderProps) => (
  <div role="alert" className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-6 text-destructive">
    <div className="text-lg font-semibold">Something went wrong.</div>
    <p className="text-sm opacity-80">
      Our team has been notified. You can try again or contact support if the
      issue persists.
    </p>
    <pre className="overflow-auto rounded bg-background/40 p-3 text-xs text-foreground">
      {error.message}
    </pre>
    <button
      type="button"
      onClick={resetError}
      className="self-start rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow"
    >
      Try again
    </button>
  </div>
);

function initSentryClient() {
  if (isInitialized) {
    return;
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    isInitialized = true;
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1',
    ),
  });

  isInitialized = true;
}

export const SentryErrorBoundary = ({
  children,
  fallback,
}: SentryErrorBoundaryProps) => {
  initSentryClient();

  return (
    <Sentry.ErrorBoundary
      fallback={fallback ?? ((props) => <DefaultErrorFallback {...props} />)}
      showDialog
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};
