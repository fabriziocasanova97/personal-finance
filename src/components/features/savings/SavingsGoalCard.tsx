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
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-sm">
              {getIcon()}
            </div>
            <div>
              <h3 className="font-heading font-bold text-gray-900 text-lg">{goal}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{getGoalDescription()}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Balance</p>
          <div className="text-4xl font-mono font-bold text-gray-900 border-b border-gray-100 pb-6">
            {formatCurrency(totalBalance)}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button onClick={() => onAdd(goal)} className="flex-1 shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Funds
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowHistory(!showHistory)} 
            className="flex-none px-3"
            title="Toggle History"
          >
            History <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
          </Button>
        </div>
      </div>

      {showHistory && (
        <div className="bg-gray-50 border-t border-gray-100 max-h-[250px] overflow-y-auto">
          {sortedContributions.length > 0 ? (
            <div className="divide-y divide-gray-200/60">
              {sortedContributions.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => onEdit(c)}
                  className="px-6 py-3 hover:bg-white cursor-pointer transition-colors flex justify-between items-center group"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{format(parseISO(c.date), 'MMM d, yyyy')}</div>
                    {c.note && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">{c.note}</div>}
                  </div>
                  <div className="font-mono text-sm font-semibold text-accent">
                    +{formatCurrency(c.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="p-6 text-center text-sm text-gray-500">
               No contributions yet.
             </div>
          )}
        </div>
      )}
    </Card>
  );
}
