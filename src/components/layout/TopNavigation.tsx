'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ReceiptText, Banknote, PiggyBank, CalendarRange, LogOut } from 'lucide-react';
import { DataSync } from './DataSync';
import { useAuth } from '@/components/auth/AuthProvider';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Fixed Costs & Debts', href: '/fixed-costs', icon: ReceiptText },
  { name: 'Daily Expenses', href: '/expenses', icon: Banknote },
  { name: 'Savings Goals', href: '/savings', icon: PiggyBank },
  { name: 'Monthly Review', href: '/monthly-review', icon: CalendarRange },
];

export function TopNavigation() {
  const pathname = usePathname();
  const { session, signOut } = useAuth();

  if (!session) return null;

  return (
    <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 pt-safe">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-12 xl:px-24">
        <div className="flex justify-between h-14 md:h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold font-heading text-accent">FinClear</span>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-5 lg:space-x-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.name}
                    className={cn(
                      'inline-flex items-center whitespace-nowrap px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ease-in-out',
                      isActive
                        ? 'border-accent text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    )}
                  >
                    <item.icon className="w-5 h-5 lg:w-4 lg:h-4 lg:mr-2" />
                    <span className="hidden lg:inline">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <DataSync />
            <button
              onClick={signOut}
              className="h-11 px-3 text-gray-500 hover:text-red-500 rounded-sm hover:bg-red-50 active:bg-red-50 transition-colors flex items-center space-x-2"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-5 h-5 md:w-6 md:h-6" />
              <span className="hidden md:inline text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
      
    </nav>
  );
}
