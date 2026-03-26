"use client";

import { useState, useEffect } from "react";
import { useStore, Budget } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  existingBudget: Budget | undefined;
}

export function BudgetModal({ isOpen, onClose, category, existingBudget }: BudgetModalProps) {
  const { budgets, setBudgets } = useStore();
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (existingBudget && isOpen) {
      setAmount(existingBudget.amount.toString());
    } else if (isOpen) {
      setAmount("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingBudget, isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    
    // If they leave it blank or 0, we can just remove the budget limit
    if (isNaN(val) || val <= 0) {
      if (existingBudget) {
        setBudgets(budgets.filter(b => b.id !== existingBudget.id));
      }
      onClose();
      return;
    }

    const newBudget: Budget = {
      id: existingBudget ? existingBudget.id : crypto.randomUUID(),
      user_id: "temp-user",
      category,
      amount: val,
    };

    if (existingBudget) {
      setBudgets(budgets.map(b => b.id === existingBudget.id ? newBudget : b));
    } else {
      setBudgets([...budgets, newBudget]);
    }
    
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Set Budget for ${category}`}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Monthly Budget Amount</Label>
          <Input 
            id="amount" 
            type="number" 
            step="0.01" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            placeholder="No limit" 
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-1">Leave blank or 0 to clear the budget limit.</p>
        </div>

        <div className="pt-4 flex items-center justify-end space-x-2 border-t border-gray-100 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Budget</Button>
        </div>
      </form>
    </Modal>
  );
}
