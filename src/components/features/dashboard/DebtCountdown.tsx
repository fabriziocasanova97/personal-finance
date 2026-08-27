"use client";

import { useStore, FixedCost } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/Card";
import { CalendarDays, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function DebtCountdown() {
  const { fixedCosts } = useStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const debts = fixedCosts.filter(c => c.type === 'debt' && c.monthsLeft);
  
  if (debts.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 flex items-center justify-center text-center flex-col text-gray-400">
           <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
           <p className="text-sm">No active debts with remaining months found.</p>
        </CardContent>
      </Card>
    );
  }

  // Find furthest debt
  const furthestDebt = debts.reduce((prev, current) => {
    return (current.monthsLeft || 0) > (prev.monthsLeft || 0) ? current : prev;
  });

  const monthsRemaining = furthestDebt.monthsLeft || 0;
  
  const isOverdue = monthsRemaining <= 0;

  return (
    <Card className="bg-white">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-full text-red-500 shrink-0">
             <CalendarDays className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-mono font-semibold text-gray-500 uppercase tracking-wider mb-1">Debt Free Target</h3>
            {isOverdue ? (
               <p className="text-xl font-bold font-heading text-red-600">Past Due</p>
            ) : (
               <div className="flex items-baseline gap-2">
                 <span className="text-3xl font-heading font-bold text-gray-900 tabular-nums">{monthsRemaining}</span>
                 <span className="text-gray-500 font-medium">{monthsRemaining === 1 ? 'month' : 'months'} to go</span>
               </div>
            )}
            <p className="text-xs text-gray-400 mt-1 truncate">Based on longest debt: {furthestDebt.name}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
