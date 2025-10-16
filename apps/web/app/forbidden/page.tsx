import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6 text-center">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">403 — Forbidden</p>
        <h1 className="text-3xl font-semibold">You do not have access to this studio view.</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Contact your studio administrator if you believe this is a mistake, or choose a different
          dashboard from the studio switcher.
        </p>
        <Button asChild>
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </div>
  );
}

