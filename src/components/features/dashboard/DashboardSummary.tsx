"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Receipt, CreditCard, PiggyBank, CircleDollarSign } from "lucide-react";
import { useEffect, useState } from "react";

export function DashboardSummary() {
  const { income, fixedCosts, expenses, savings } = useStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  // Calculate Monthly Metrics
  const monthlyIncome = (income?.weekly_amount || 0) * 4.33;
  
  const monthlyFixedCosts = fixedCosts.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Realistically daily spending should be filtered by current month, but for MVP we sum expenses 
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  const totalSaved = savings.reduce((acc, curr) => acc + curr.amount, 0);

  const leftToSpend = monthlyIncome - monthlyFixedCosts - totalSaved - totalExpenses;

  const cards = [
    { label: "Left to Spend", value: leftToSpend, icon: CircleDollarSign, color: "text-accent", hero: true },
    { label: "Monthly Income", value: monthlyIncome, icon: Wallet, color: "text-blue-500", hero: false },
    { label: "Fixed Costs", value: monthlyFixedCosts, icon: Receipt, color: "text-amber-500", hero: false },
    { label: "Daily Spending", value: totalExpenses, icon: CreditCard, color: "text-red-500", hero: false },
    { label: "Saved", value: totalSaved, icon: PiggyBank, color: "text-purple-500", hero: false },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
      {cards.map((stat, i) => (
        <Card
          key={i}
          className={stat.hero ? "col-span-2 lg:col-span-1 lg:order-last border-accent/30 bg-accent/5" : "min-w-0"}
        >
          <CardContent
            className={`flex flex-col items-center justify-center text-center ${
              stat.hero ? "p-5 md:p-4 space-y-2" : "p-3 md:p-4 space-y-1.5 md:space-y-2"
            }`}
          >
            <div
              className={`rounded-full bg-gray-50 flex items-center justify-center ${stat.color} ${
                stat.hero ? "p-3" : "p-2 md:p-3"
              }`}
            >
              <stat.icon className={stat.hero ? "w-6 h-6" : "w-4 h-4 md:w-6 md:h-6"} />
            </div>
            <div className="min-w-0 w-full">
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider font-sans truncate">{stat.label}</p>
              <h4
                className={`font-mono font-bold text-gray-900 mt-1 tabular-nums truncate ${
                  stat.hero ? "text-3xl lg:text-xl" : "text-lg md:text-xl"
                }`}
              >
                {formatCurrency(stat.value)}
              </h4>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
