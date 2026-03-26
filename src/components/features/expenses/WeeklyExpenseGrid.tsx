"use client";

import { useMemo } from "react";
import { Expense } from "@/lib/store";
import { startOfWeek, addDays, format, isSameDay, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface WeeklyExpenseGridProps {
  expenses: Expense[];
  currentDate: Date;
}

export function WeeklyExpenseGrid({ expenses, currentDate }: WeeklyExpenseGridProps) {
  // Generate the days of the current week (Monday to Sunday)
  const weekDays = useMemo(() => {
    // startOfWeek uses Sunday=0. We want Monday=1, so we offset if it's Sunday.
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); 
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  // Map expenses to days
  const dailyTotals = useMemo(() => {
    return weekDays.map((day) => {
      const dailyExpenses = expenses.filter(exp => isSameDay(parseISO(exp.date), day));
      const total = dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        date: day,
        total,
      };
    });
  }, [weekDays, expenses]);

  const weeklyTotal = dailyTotals.reduce((sum, day) => sum + day.total, 0);

  return (
    <div className="bg-white rounded-sm border border-gray-100 shadow-sm p-4 md:p-6 mb-8 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-heading font-semibold text-gray-900 text-lg">Weekly Overview</h3>
          <p className="text-sm text-gray-500">{format(weekDays[0], "MMM d")} - {format(weekDays[6], "MMM d, yyyy")}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Week Total</p>
          <p className="font-mono text-xl font-bold text-accent">{formatCurrency(weeklyTotal)}</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-4">
        {dailyTotals.map(({ date, total }, index) => {
          const isToday = isSameDay(date, new Date());
          // the height calculation for the bar could scale to max day. Just mapping some static scale.
          const maxTotal = Math.max(...dailyTotals.map(d => d.total), 1); // Avoid div by 0
          const barHeight = Math.max((total / maxTotal) * 100, 4); // Min height 4%

          return (
            <div key={index} className="flex flex-col items-center">
              <div className="h-32 w-full flex items-end justify-center mb-2 bg-gray-50 rounded-sm relative overflow-hidden group">
                <div 
                  className={`w-full absolute bottom-0 rounded-b-sm transition-all duration-500 ${isToday ? 'bg-accent/80' : 'bg-green-100'} ${total > 0 ? 'group-hover:bg-accent' : ''}`}
                  style={{ height: `${barHeight}%` }}
                />
                <div className="z-10 text-[10px] md:text-xs font-mono font-medium text-gray-700 pb-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {total > 0 && formatCurrency(total)}
                </div>
              </div>
              <div className={`text-xs font-semibold ${isToday ? 'text-accent' : 'text-gray-500'}`}>
                {format(date, "EEE")}
              </div>
              <div className={`text-xs font-mono mt-1 ${isToday ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                {format(date, "d")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
