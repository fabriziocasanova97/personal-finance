"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { BudgetModal } from "@/components/features/monthly-review/BudgetModal";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export function BudgetOverview() {
  const { budgets, expenses } = useStore();
  const [categoryToEdit, setCategoryToEdit] = useState<string | null>(null);

  const monthPrefix = format(new Date(), "yyyy-MM");
  const spentThisMonth = (category: string) =>
    expenses
      .filter((e) => e.category === category && e.date.startsWith(monthPrefix))
      .reduce((sum, e) => sum + e.amount, 0);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-semibold text-lg text-gray-900">Monthly Budgets</h3>
          <p className="text-sm text-gray-500">Tap a category to set or clear its limit for {format(new Date(), "MMMM")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {EXPENSE_CATEGORIES.map((category) => {
          const budget = budgets.find((b) => b.category === category);
          const spent = spentThisMonth(category);
          const pct = budget ? (spent / budget.amount) * 100 : 0;
          const barColor = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-accent";

          return (
            <Card key={category} className="hover:border-accent/50 transition-colors">
              <button
                type="button"
                onClick={() => setCategoryToEdit(category)}
                className="block text-left w-full min-h-14 p-3 cursor-pointer active:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">{category}</span>
                {budget && pct >= 100 && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500">Over</span>
                )}
              </div>
              <div className="mt-1 font-mono text-xs text-gray-500">
                {formatCurrency(spent)}
                {budget ? ` / ${formatCurrency(budget.amount)}` : " · No limit"}
              </div>
              {budget && (
                <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              )}
              </button>
            </Card>
          );
        })}
      </div>

      <BudgetModal
        isOpen={categoryToEdit !== null}
        onClose={() => setCategoryToEdit(null)}
        category={categoryToEdit || ""}
        existingBudget={budgets.find((b) => b.category === categoryToEdit)}
      />
    </section>
  );
}
