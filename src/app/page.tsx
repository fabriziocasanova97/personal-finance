"use client";

import { DashboardSummary } from "@/components/features/dashboard/DashboardSummary";
import { WeeklyIncomeEditor } from "@/components/features/dashboard/WeeklyIncomeEditor";
import { DebtCountdown } from "@/components/features/dashboard/DebtCountdown";

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-gray-900 tracking-tight">Dashboard</h1>
      </div>
      
      <DashboardSummary />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <WeeklyIncomeEditor />
        <DebtCountdown />
      </div>
    </div>
  );
}
