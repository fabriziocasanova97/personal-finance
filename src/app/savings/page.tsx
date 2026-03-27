"use client";

import { useStore, Savings } from "@/lib/store";
import { useState, useEffect } from "react";
import { AddContributionModal, SAVINGS_GOALS } from "@/components/features/savings/AddContributionModal";
import { SavingsGoalCard } from "@/components/features/savings/SavingsGoalCard";

type GoalType = 'Emergency Fund' | 'Tax Savings' | 'HYS Account';

export default function SavingsPage() {
  const { savings } = useStore();
  const [mounted, setMounted] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contributionToEdit, setContributionToEdit] = useState<Savings | null>(null);
  const [activeGoal, setActiveGoal] = useState<GoalType>("Emergency Fund");

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const openAddModal = (goal: GoalType) => {
    setActiveGoal(goal);
    setContributionToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (contribution: Savings) => {
    setActiveGoal(contribution.goal);
    setContributionToEdit(contribution);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8">
      
      <div>
        <h2 className="text-2xl font-heading font-bold text-gray-900">Savings Goals</h2>
        <p className="text-gray-500 text-sm mt-1">Track funds allocated toward major targets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SAVINGS_GOALS.map(goal => {
          const goalContributions = savings.filter(s => s.goal === goal);
          return (
            <SavingsGoalCard 
              key={goal}
              goal={goal}
              contributions={goalContributions}
              onAdd={openAddModal}
              onEdit={openEditModal}
            />
          );
        })}
      </div>

      <AddContributionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        contributionToEdit={contributionToEdit} 
        defaultGoal={activeGoal}
      />

    </div>
  );
}
