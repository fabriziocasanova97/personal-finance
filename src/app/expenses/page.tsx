"use client";

import { useStore, Expense } from "@/lib/store";
import { FilterChip } from "@/components/ui/FilterChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { AddExpenseModal, EXPENSE_CATEGORIES } from "@/components/features/expenses/AddExpenseModal";
import { WeeklyExpenseGrid } from "@/components/features/expenses/WeeklyExpenseGrid";
import { QuickExpenseInput } from "@/components/features/expenses/QuickExpenseInput";
import { BudgetOverview } from "@/components/features/expenses/BudgetOverview";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Plus } from "lucide-react";

export default function ExpensesPage() {
  const { expenses } = useStore();
  const [mounted, setMounted] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Date Filtering State
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
    setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
  }, []);

  if (!mounted) return null;

  // Filter for the selected date range
  const currentMonthExpenses = expenses.filter(exp => {
    if (!startDate || !endDate) return true;
    return exp.date >= startDate && exp.date <= endDate;
  });

  // Derived filter list
  const filterCategories = ["All", ...EXPENSE_CATEGORIES];

  // Applied category filter inside this month
  const filteredList = activeCategory === "All" 
    ? currentMonthExpenses 
    : currentMonthExpenses.filter(e => e.category === activeCategory);

  // Sort dates descending
  const sortedList = [...filteredList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const openModal = (expense?: Expense) => {
    setExpenseToEdit(expense || null);
    setIsModalOpen(true);
  };

  const TableHeader = () => (
    <div className="hidden md:flex items-center gap-4 py-3 px-4 bg-gray-50 border-y border-gray-200 text-xs font-mono font-semibold text-gray-500 uppercase tracking-wider">
      <div className="flex-1">Description / Date / Category</div>
      <div className="text-right">Amount</div>
    </div>
  );

  const renderRow = (item: Expense) => (
    <ListRow
      key={item.id}
      onClick={() => openModal(item)}
      title={item.description}
      meta={
        <>
          <span className="font-mono tabular-nums">{format(parseISO(item.date), 'MMM d')}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-gray-100 text-gray-800">
            {item.category}
          </span>
        </>
      }
      trailing={formatCurrency(item.amount)}
    />
  );

  const subtotal = sortedList.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8 pb-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">Daily Expenses</h2>
          <p className="text-gray-500 text-sm mt-1">
            Track day-to-day spending{startDate && endDate ? ` from ${format(parseISO(startDate), 'MMM d, yyyy')} to ${format(parseISO(endDate), 'MMM d, yyyy')}` : ''}
          </p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-1" /> Add Expense
        </Button>
      </div>

      <QuickExpenseInput />
      <WeeklyExpenseGrid expenses={expenses} currentDate={startDate ? parseISO(startDate) : new Date()} />
      <BudgetOverview />

      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-2">
            {filterCategories.map(cat => (
              <FilterChip 
                key={cat} 
                active={activeCategory === cat} 
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </FilterChip>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white px-3 py-2 rounded-sm border border-gray-200 shadow-sm">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Date:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-base h-11 w-full sm:w-[150px] bg-transparent border border-gray-200 rounded-sm px-2 focus:ring-0 focus:border-accent text-gray-700 font-medium"
            />
            <span className="text-xs text-gray-400 sm:text-center">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-base h-11 w-full sm:w-[150px] bg-transparent border border-gray-200 rounded-sm px-2 focus:ring-0 focus:border-accent text-gray-700 font-medium"
            />
          </div>
        </div>

        <Card className="overflow-hidden">
          <TableHeader />
          {sortedList.length > 0 ? (
            <>
              <div className="divide-y divide-gray-100">
                {sortedList.map(renderRow)}
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-500">Subtotal ({sortedList.length})</span>
                <span className="font-mono tabular-nums font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
            </>
          ) : (
             <div className="py-12 text-center text-sm text-gray-500 bg-gray-50/30">
                <p>No expenses logged for this view.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => openModal()}>Log an expense</Button>
             </div>
          )}
        </Card>
      </section>

      <AddExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        expenseToEdit={expenseToEdit} 
      />

    </div>
  );
}
