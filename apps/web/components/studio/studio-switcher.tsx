'use client';

import { useMemo, useState } from 'react';
import { ChevronDownIcon, Loader2Icon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useUpdateStudio } from '@/lib/api/hooks';

export const StudioSwitcher = () => {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const mutation = useUpdateStudio();

  const studios = session?.user?.studios ?? [];
  const activeStudioId = session?.user?.activeStudioId;
  const activeStudio = useMemo(
    () => studios.find((studio) => studio.id === activeStudioId) ?? studios[0],
    [studios, activeStudioId]
  );

  const handleSelect = async (studioId: string) => {
    setOpen(false);
    if (!studioId || studioId === activeStudioId) return;
    await mutation.mutateAsync(studioId);
    await update({ activeStudioId: studioId });
    router.refresh();
  };

  if (!studios.length) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="font-medium">{activeStudio?.name ?? 'Select studio'}</span>
        {mutation.isPending ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <ChevronDownIcon className="h-4 w-4" />}
      </Button>
      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-border bg-background p-2 shadow-lg"
          role="listbox"
        >
          {studios.map((studio) => (
            <button
              key={studio.id}
              type="button"
              role="option"
              aria-selected={studio.id === activeStudioId}
              onClick={() => handleSelect(studio.id)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted ${
                studio.id === activeStudioId ? 'font-semibold text-foreground' : 'text-muted-foreground'
              }`}
            >
              {studio.name}
              {studio.id === activeStudioId ? <span className="text-xs uppercase text-foreground">Active</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

