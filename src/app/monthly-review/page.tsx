"use client";

import { useStore } from "@/lib/store";
import { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { parseISO, getMonth, getYear } from "date-fns";
import { Card } from "@/components/ui/Card";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEAR = 2026; // Static for MVP as per previous implementation

export default function MonthlyReviewPage() {
  const { income, fixedCosts, expenses, savings } = useStore();
  const [mounted, setMounted] = useState(false);
  
  // By default select the first 3 months + current month, or all if we want. Let's select all initially for easy viewing.
  const [selectedMonths, setSelectedMonths] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const toggleMonth = (index: number) => {
    setSelectedMonths(prev => 
      prev.includes(index) 
        ? prev.filter(m => m !== index).sort((a,b) => a - b)
        : [...prev, index].sort((a,b) => a - b)
    );
  };

  const activeMonths = selectedMonths.map(i => MONTHS[i]);

  // --- DATA CALCULATIONS ---

  // 1. Income (same for all months based on current state)
  const monthlyIncome = (income?.weekly_amount || 0) * 4.33;

  // 2. Fixed Costs (same for all months based on current state)
  const regularFixedCosts = fixedCosts.filter(c => c.type === 'fixed');
  const totalFixedCosts = regularFixedCosts.reduce((sum, c) => sum + c.amount, 0);

  // 3. Debts
  const debtCosts = fixedCosts.filter(c => c.type === 'debt');
  const isDebtActiveInMonth = (cost: any, monthIndex: number) => {
    if (cost.monthsLeft == null) return true;
    const currentMonth = new Date().getMonth();
    // Assume it was active in the past. It expires after currentMonth + monthsLeft
    if (monthIndex < currentMonth) return true;
    return monthIndex < currentMonth + cost.monthsLeft;
  };
  const getDebtSubtotalForMonth = (monthIndex: number) => {
    return debtCosts.reduce((sum, cost) => sum + (isDebtActiveInMonth(cost, monthIndex) ? cost.amount : 0), 0);
  };

  // 4. Daily Expenses
  const expenseCategories = Array.from(new Set(expenses.map(e => e.category))).sort();
  const getExpenseForMonth = (category: string, monthIndex: number) => {
    return expenses
      .filter(e => {
        if (e.category !== category) return false;
        const d = parseISO(e.date);
        return getMonth(d) === monthIndex && getYear(d) === YEAR;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };
  const getExpenseSubtotalForMonth = (monthIndex: number) => {
    return expenseCategories.reduce((sum, cat) => sum + getExpenseForMonth(cat, monthIndex), 0);
  };

  // 5. Savings
  const savingsGoals = Array.from(new Set(savings.map(s => s.goal))).sort();
  const getSavingsForMonth = (goal: string, monthIndex: number) => {
    return savings
      .filter(s => {
        if (s.goal !== goal) return false;
        const d = parseISO(s.date);
        return getMonth(d) === monthIndex && getYear(d) === YEAR;
      })
      .reduce((sum, s) => sum + s.amount, 0);
  };
  const getSavingsSubtotalForMonth = (monthIndex: number) => {
    return savingsGoals.reduce((sum, goal) => sum + getSavingsForMonth(goal, monthIndex), 0);
  };

  // 6. Available Calculation (with carryover)
  const availablePerMonth: Record<number, number> = {};
  const rolloverPerMonth: Record<number, number> = {};
  let carryOver = 0;

  selectedMonths.forEach(monthIndex => {
    rolloverPerMonth[monthIndex] = carryOver;
    
    const debtsTotal = getDebtSubtotalForMonth(monthIndex);
    const expensesTotal = getExpenseSubtotalForMonth(monthIndex);
    const savingsTotal = getSavingsSubtotalForMonth(monthIndex);
    
    const netForMonth = monthlyIncome - totalFixedCosts - debtsTotal - expensesTotal - savingsTotal;
    const totalAvailable = netForMonth + carryOver;
    
    availablePerMonth[monthIndex] = totalAvailable;
    carryOver = totalAvailable; // carry this over to the next selected month
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8">
      
      <div>
        <h2 className="text-2xl font-heading font-bold text-gray-900">Monthly Review - {YEAR}</h2>
        <p className="text-gray-500 text-sm mt-1">Detailed breakdown of income and expenses over time.</p>
      </div>

      {/* Month Toggle List */}
      <Card className="p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Select Months to Display</h3>
        <div className="flex flex-wrap gap-2">
          {MONTHS.map((m, i) => (
             <button
              key={m}
              onClick={() => toggleMonth(i)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedMonths.includes(i) 
                ? 'bg-accent text-white shadow-sm' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
             >
               {m}
             </button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 uppercase tracking-wider text-gray-500 text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 sticky left-0 bg-gray-50 z-10 w-64 border-r border-gray-200">Category</th>
                {activeMonths.map(m => (
                  <th key={m} className="px-4 py-3 text-right w-32 border-r border-gray-200 last:border-r-0">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              
              {/* --- INCOME SECTION --- */}
              <tr className="bg-green-50/30">
                <td className="px-4 py-4 sticky left-0 z-10 border-r border-gray-200 font-bold text-gray-900 bg-white group-hover:bg-green-50/30">
                  Income
                </td>
                {selectedMonths.map(m => (
                  <td key={m} className="px-4 py-3 text-right font-mono font-medium text-green-700 border-r border-gray-200 last:border-r-0">
                    {formatCurrency(monthlyIncome)}
                  </td>
                ))}
              </tr>
              <tr className="bg-green-50/10 hover:bg-green-50/20 transition-colors">
                <td className="px-4 py-3 sticky left-0 z-10 border-r border-gray-200 text-gray-600 bg-white">
                  + Rollover from Previous Month
                </td>
                {selectedMonths.map(m => (
                  <td key={m} className="px-4 py-3 text-right font-mono text-gray-500 border-r border-gray-200 last:border-r-0">
                    {formatCurrency(rolloverPerMonth[m])}
                  </td>
                ))}
              </tr>
              <tr className="bg-green-100/50 font-bold border-b-2 border-green-200/50">
                <td className="px-4 py-4 sticky left-0 z-10 border-r border-gray-200 text-green-900 bg-white">
                  Total Monthly Funds
                </td>
                {selectedMonths.map(m => (
                  <td key={m} className="px-4 py-4 text-right font-mono text-green-800 border-r border-gray-200 last:border-r-0">
                    {formatCurrency(monthlyIncome + rolloverPerMonth[m])}
                  </td>
                ))}
              </tr>

              {/* --- FIXED COSTS SECTION --- */}
               <tr className="bg-gray-100/50">
                <td colSpan={selectedMonths.length + 1} className="px-4 py-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Fixed Costs
                </td>
              </tr>
              {regularFixedCosts.map(cost => (
                <tr key={cost.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-gray-200 text-gray-700">
                    {cost.name} <span className="text-xs text-gray-400 ml-2">({cost.category})</span>
                  </td>
                  {selectedMonths.map(m => (
                    <td key={m} className="px-4 py-3 text-right font-mono text-gray-700 border-r border-gray-200 last:border-r-0">
                      {formatCurrency(cost.amount)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-amber-50/30 font-semibold border-t-2 border-gray-100">
                <td className="px-4 py-3 sticky left-0 z-10 border-r border-gray-200 text-amber-900 bg-white">
                  Fixed Costs Subtotal
                </td>
                {selectedMonths.map(m => (
                  <td key={m} className="px-4 py-3 text-right font-mono text-amber-700 border-r border-gray-200 last:border-r-0">
                    {formatCurrency(totalFixedCosts)}
                  </td>
                ))}
              </tr>

              {/* --- DEBTS SECTION --- */}
              <tr className="bg-gray-100/50">
                <td colSpan={selectedMonths.length + 1} className="px-4 py-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Debts & Payment Plans
                </td>
              </tr>
              {debtCosts.map(cost => (
                <tr key={cost.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-gray-200 text-gray-700 flex justify-between items-center">
                    <span>{cost.name}</span>
                  </td>
                  {selectedMonths.map(m => {
                    const isActive = isDebtActiveInMonth(cost, m);
                    return (
                      <td key={m} className={`px-4 py-3 text-right font-mono border-r border-gray-200 last:border-r-0 ${isActive ? 'text-gray-700' : 'text-gray-300'}`}>
                        {isActive ? formatCurrency(cost.amount) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-red-50/30 font-semibold border-t-2 border-gray-100">
                <td className="px-4 py-3 sticky left-0 z-10 border-r border-gray-200 text-red-900 bg-white">
                  Debts Subtotal
                </td>
                {selectedMonths.map(m => (
                  <td key={m} className="px-4 py-3 text-right font-mono text-red-700 border-r border-gray-200 last:border-r-0">
                    {formatCurrency(getDebtSubtotalForMonth(m))}
                  </td>
                ))}
              </tr>

              {/* --- DAILY EXPENSES SECTION --- */}
               <tr className="bg-gray-100/50">
                <td colSpan={selectedMonths.length + 1} className="px-4 py-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Daily Expenses
                </td>
              </tr>
              {expenseCategories.map(cat => (
                <tr key={cat} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-gray-200 text-gray-700">
                    {cat}
                  </td>
                  {selectedMonths.map(m => {
                    const amount = getExpenseForMonth(cat, m);
                    return (
                      <td key={m} className={`px-4 py-3 text-right font-mono border-r border-gray-200 last:border-r-0 ${amount === 0 ? 'text-gray-300' : 'text-gray-700'}`}>
                        {amount > 0 ? formatCurrency(amount) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-orange-50/30 font-semibold border-t-2 border-gray-100">
                <td className="px-4 py-3 sticky left-0 z-10 border-r border-gray-200 text-orange-900 bg-white">
                  Daily Expenses Subtotal
                </td>
                {selectedMonths.map(m => (
                  <td key={m} className="px-4 py-3 text-right font-mono text-orange-700 border-r border-gray-200 last:border-r-0">
                    {formatCurrency(getExpenseSubtotalForMonth(m))}
                  </td>
                ))}
              </tr>

              {/* --- SAVINGS SECTION --- */}
               <tr className="bg-gray-100/50">
                <td colSpan={selectedMonths.length + 1} className="px-4 py-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Savings
                </td>
              </tr>
              {savingsGoals.map(goal => (
                <tr key={goal} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-gray-200 text-gray-700">
                    {goal}
                  </td>
                  {selectedMonths.map(m => {
                    const amount = getSavingsForMonth(goal, m);
                    return (
                      <td key={m} className={`px-4 py-3 text-right font-mono border-r border-gray-200 last:border-r-0 ${amount === 0 ? 'text-gray-300' : 'text-gray-700'}`}>
                        {amount > 0 ? formatCurrency(amount) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
               <tr className="bg-purple-50/30 font-semibold border-t-2 border-gray-100">
                <td className="px-4 py-3 sticky left-0 z-10 border-r border-gray-200 text-purple-900 bg-white">
                  Savings Subtotal
                </td>
                {selectedMonths.map(m => (
                  <td key={m} className="px-4 py-3 text-right font-mono text-purple-700 border-r border-gray-200 last:border-r-0">
                    {formatCurrency(getSavingsSubtotalForMonth(m))}
                  </td>
                ))}
              </tr>

              {/* --- FINAL AVAILABLE / CARRIED OVER --- */}
              <tr className="bg-blue-50/40 font-bold border-t-2 border-blue-200/50">
                <td className="px-4 py-5 sticky left-0 z-10 border-r border-gray-200 text-blue-900 bg-white whitespace-normal">
                  Available (Rollover to Next Month)
                </td>
                 {selectedMonths.map((m) => {
                  const available = availablePerMonth[m];
                  return (
                    <td key={m} className={`px-4 py-5 text-right font-mono text-lg border-r border-gray-200 last:border-r-0 ${available >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                      {formatCurrency(available)}
                    </td>
                  );
                 })}
              </tr>

            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}

