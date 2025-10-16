'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { navigation } from '@/config/navigation';
import { useI18n } from '@/lib/i18n';
import type { SessionUser } from '@/lib/api/client';

interface SideNavProps {
  user?: SessionUser;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export const SideNav = ({ user, collapsed = false, onNavigate }: SideNavProps) => {
  const pathname = usePathname();
  const { t } = useI18n();
  const items = user ? navigation[user.role] : [];

  const baseClasses = collapsed
    ? 'fixed inset-y-0 left-0 z-30 w-64 border-r border-border bg-background/95 p-4 shadow-lg md:static md:block'
    : 'hidden md:block md:w-72 md:border-r md:border-border md:bg-background md:p-6';

  return (
    <aside className={baseClasses}>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname?.startsWith(item.href);
          const labelKey = item.translationKey ?? `nav.${user?.role}.${item.label.toLowerCase().replace(/\s+/g, '-')}`;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-start gap-3 rounded-md px-3 py-3 transition ${
                isActive ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="mt-1 h-4 w-4" />
              <div>
                <p className="text-sm font-semibold">
                  {t(labelKey, item.label)}
                </p>
                {item.description ? (
                  <p className={`text-xs ${isActive ? 'text-background/80' : 'text-muted-foreground'}`}>
                    {item.description}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

