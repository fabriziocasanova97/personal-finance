"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddExpenseModal } from "@/components/features/expenses/AddExpenseModal";
import { Button } from "@/components/ui/Button";

export function GlobalAddExpense() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 rounded-full w-14 h-14 shadow-lg flex items-center justify-center p-0 transition-transform hover:scale-105 active:scale-95 bg-accent hover:bg-accent/90 text-white"
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
