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
    <nav className="bg-white border-b border-gray-200">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-12 xl:px-24">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold font-heading text-accent">FinClear</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ease-in-out',
                      isActive
                        ? 'border-accent text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <DataSync />
            <button
              onClick={signOut}
              className="p-2 text-gray-500 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu - simplified for now */}
      <div className="sm:hidden border-t border-gray-200 overflow-x-auto">
        <div className="pt-2 pb-3 space-y-1 flex px-2 whitespace-nowrap">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block pl-3 pr-4 py-2 border-l-4 text-base font-medium',
                  isActive
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                 <div className="flex items-center">
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                 </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
