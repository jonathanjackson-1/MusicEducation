import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6 text-center">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">404 — Page not found</p>
        <h1 className="text-3xl font-semibold">We couldn&apos;t find that lesson hall.</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Double-check the URL or jump back into your studio dashboard to continue where you left off.
        </p>
        <Button asChild>
          <Link href="/">Take me home</Link>
        </Button>
      </div>
    </div>
  );
}

