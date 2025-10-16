'use client';

import Link from 'next/link';
import { LogOutIcon, MenuIcon } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

import { StudioSwitcher } from '@/components/studio/studio-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface TopNavProps {
  onToggleSidebar?: () => void;
}

export const TopNav = ({ onToggleSidebar }: TopNavProps) => {
  const { data: session } = useSession();
  const initials = session?.user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('');

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleSidebar} aria-label="Toggle navigation">
          <MenuIcon className="h-5 w-5" />
        </Button>
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="rounded-md bg-foreground px-2 py-1 text-sm uppercase text-background">Soundstudio</span>
        </Link>
        <StudioSwitcher />
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium leading-tight">{session?.user?.name ?? 'Guest'}</p>
          <p className="text-xs text-muted-foreground capitalize">{session?.user?.role ?? 'visitor'}</p>
        </div>
        <Avatar>
          <AvatarImage src={session?.user?.avatarUrl} alt={session?.user?.name ?? 'User'} />
          <AvatarFallback>{initials ?? 'SS'}</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/login' })} aria-label="Sign out">
          <LogOutIcon className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

