'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ReceiptText, Banknote, PiggyBank, CalendarRange } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export const tabs = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Fixed', href: '/fixed-costs', icon: ReceiptText },
  { name: 'Expenses', href: '/expenses', icon: Banknote },
  { name: 'Savings', href: '/savings', icon: PiggyBank },
  { name: 'Review', href: '/monthly-review', icon: CalendarRange },
];

export function isActivePath(pathname: string | null, href: string) {
  return pathname === href || (href !== '/' && !!pathname?.startsWith(href));
}

export function BottomTabBar() {
  const pathname = usePathname();
  const { session } = useAuth();
  if (!session || pathname === '/login') return null;

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 pb-safe"
    >
      <ul className="grid grid-cols-5">
        {tabs.map((tab) => {
          const active = isActivePath(pathname, tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 h-14 text-[11px] font-medium transition-colors active:bg-gray-100',
                  active ? 'text-accent' : 'text-gray-500'
                )}
              >
                <tab.icon className={cn('w-6 h-6', active && 'stroke-[2.25]')} />
                <span className="font-mono uppercase tracking-wide">{tab.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
