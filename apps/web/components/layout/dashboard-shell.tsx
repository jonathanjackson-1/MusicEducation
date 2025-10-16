'use client';

import Link from 'next/link';
import { useState } from 'react';

import { quickActions } from '@/config/navigation';
import type { SessionUser } from '@/lib/api/client';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SideNav } from './side-nav';
import { TopNav } from './top-nav';

interface DashboardShellProps {
  user?: SessionUser;
  children: React.ReactNode;
}

export const DashboardShell = ({ user, children }: DashboardShellProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const actions = user ? quickActions[user.role] : [];

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div className="flex flex-1">
        <SideNav user={user} collapsed={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:p-8">
          {actions.length ? (
            <div className="mb-6 flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button key={action.href} variant="secondary" className="gap-2" asChild>
                  <Link href={action.href}>
                    <action.icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          ) : null}
          <div className="space-y-6">
            {typeof children === 'function' ? (children as () => React.ReactNode)() : children}
          </div>
        </main>
      </div>
    </div>
  );
};

export const DashboardSection = ({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

