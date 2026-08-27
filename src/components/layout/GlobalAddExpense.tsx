"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddExpenseModal } from "@/components/features/expenses/AddExpenseModal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";

export function GlobalAddExpense() {
  const [isOpen, setIsOpen] = useState(false);
  const { session } = useAuth();

  if (!session) return null;

  return (
    <>
      <Button
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-8 md:right-8 z-40 rounded-full w-14 h-14 shadow-lg flex items-center justify-center p-0 transition-transform hover:scale-105 active:scale-95 bg-accent hover:bg-accent/90 text-white"
        onClick={() => setIsOpen(true)}
        aria-label="Add Expense"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </Button>

      {/* Conditionally render the modal to avoid unnecessary DOM nodes or store hydration issues until requested, although AddExpenseModal manages its own isOpen logic too */}
      <AddExpenseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
