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
    { label: "Monthly Income", value: monthlyIncome, icon: Wallet, color: "text-blue-500" },
    { label: "Fixed Costs", value: monthlyFixedCosts, icon: Receipt, color: "text-amber-500" },
    { label: "Daily Spending", value: totalExpenses, icon: CreditCard, color: "text-red-500" },
    { label: "Saved", value: totalSaved, icon: PiggyBank, color: "text-purple-500" },
    { label: "Left to Spend", value: leftToSpend, icon: CircleDollarSign, color: "text-accent" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((stat, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className={`p-3 rounded-full bg-gray-50 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider font-sans">{stat.label}</p>
              <h4 className="text-xl font-mono font-bold text-gray-900 mt-1">{formatCurrency(stat.value)}</h4>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
