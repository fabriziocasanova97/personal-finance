"use client";

import { DashboardSummary } from "@/components/features/dashboard/DashboardSummary";
import { WeeklyIncomeEditor } from "@/components/features/dashboard/WeeklyIncomeEditor";
import { DebtCountdown } from "@/components/features/dashboard/DebtCountdown";
import { QuickExpenseInput } from "@/components/features/expenses/QuickExpenseInput";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 md:space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 tracking-tight">Dashboard</h1>
      </div>
      <QuickExpenseInput />
      
      <DashboardSummary />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
        <WeeklyIncomeEditor />
        <DebtCountdown />
      </div>
    </div>
  );
}
