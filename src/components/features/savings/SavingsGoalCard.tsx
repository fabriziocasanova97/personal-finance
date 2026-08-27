"use client";

import { Savings } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Plus, Wallet, ShieldAlert, Receipt, ChevronRight } from "lucide-react";
import { useState } from "react";

type GoalType = 'Emergency Fund' | 'Tax Savings' | 'HYS Account';

interface SavingsGoalCardProps {
  goal: GoalType;
  contributions: Savings[];
  onAdd: (goal: GoalType) => void;
  onEdit: (contribution: Savings) => void;
}

export function SavingsGoalCard({ goal, contributions, onAdd, onEdit }: SavingsGoalCardProps) {
  const [showHistory, setShowHistory] = useState(false);

  // Total balance for this goal
  const totalBalance = contributions.reduce((sum, item) => sum + item.amount, 0);

  // Sort contributions descending
  const sortedContributions = [...contributions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getIcon = () => {
    switch (goal) {
      case 'Emergency Fund': return <ShieldAlert className="w-5 h-5 text-accent" />;
      case 'Tax Savings': return <Receipt className="w-5 h-5 text-accent" />;
      case 'HYS Account': return <Wallet className="w-5 h-5 text-accent" />;
      default: return <Wallet className="w-5 h-5 text-accent" />;
    }
  };

  const getGoalDescription = () => {
    switch (goal) {
      case 'Emergency Fund': return "Targeting 3-6 months of essential living expenses.";
      case 'Tax Savings': return "Allocations set aside for upcoming tax obligations.";
      case 'HYS Account': return "High Yield Savings for intermediate term goals.";
      default: return "";
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden bg-white hover:border-accent/30 transition-colors">
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 bg-green-50 rounded-sm shrink-0">
              {getIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-gray-900 text-lg">{goal}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{getGoalDescription()}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 mb-4 sm:mb-6">
          <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">Total Balance</p>
          <div className="text-3xl sm:text-4xl font-mono font-bold text-gray-900 tabular-nums border-b border-gray-100 pb-4 sm:pb-6 truncate">
            {formatCurrency(totalBalance)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => onAdd(goal)} className="flex-1 h-11 shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Funds
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowHistory(!showHistory)} 
            className="flex-none h-11 px-4 active:bg-gray-100"
            aria-expanded={showHistory}
          >
            History <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
          </Button>
        </div>
      </div>

      {showHistory && (
        <div className="bg-gray-50 border-t border-gray-100 max-h-[250px] overflow-y-auto overscroll-contain">
          {sortedContributions.length > 0 ? (
            <div className="divide-y divide-gray-200/60">
              {sortedContributions.map(c => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => onEdit(c)}
                  className="w-full min-h-14 px-4 sm:px-6 py-3 text-left hover:bg-white active:bg-gray-100 transition-colors flex justify-between items-center gap-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">{format(parseISO(c.date), 'MMM d, yyyy')}</div>
                    {c.note && <div className="text-xs text-gray-500 mt-0.5 truncate">{c.note}</div>}
                  </div>
                  <div className="font-mono text-sm font-semibold text-accent tabular-nums shrink-0">
                    +{formatCurrency(c.amount)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
             <div className="p-4 sm:p-6 text-center text-sm text-gray-500">
               No contributions yet.
             </div>
          )}
        </div>
      )}
    </Card>
  );
}
