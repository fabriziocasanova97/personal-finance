"use client";

import { useState, useEffect } from "react";
import { useStore, Expense } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { dbInsertExpense, dbDeleteExpense } from "@/lib/db";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { addExpense } from "@/lib/expenses";
import { reportSyncError } from "@/lib/toast";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

export { EXPENSE_CATEGORIES } from "@/lib/categories";

export function AddExpenseModal({ isOpen, onClose, expenseToEdit }: AddExpenseModalProps) {
  const { expenses, setExpenses } = useStore();
  
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);

  useEffect(() => {
    if (expenseToEdit && isOpen) {
      setAmount(expenseToEdit.amount.toString());
      setDate(expenseToEdit.date);
      setDescription(expenseToEdit.description);
      setCategory(expenseToEdit.category);
    } else if (isOpen) {
      setAmount("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setDescription("");
      setCategory(EXPENSE_CATEGORIES[0]);
    }
  }, [expenseToEdit, isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    
    if (isNaN(val) || !date || !description || !category) return;

    if (expenseToEdit) {
      const updatedExpense: Expense = {
        id: expenseToEdit.id,
        user_id: "temp-user",
        amount: val,
        date,
        description,
        category,
      };
      setExpenses(expenses.map(exp => exp.id === expenseToEdit.id ? updatedExpense : exp));

      // Background cloud sync
      dbInsertExpense(updatedExpense).catch(reportSyncError('expense'));
    } else {
      addExpense({ amount: val, description, category, date });
    }

    onClose();
  };

  const handleDelete = () => {
    if (expenseToEdit) {
      setExpenses(expenses.filter(exp => exp.id !== expenseToEdit.id));
      dbDeleteExpense(expenseToEdit.id).catch(reportSyncError('deletion'));
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? "Edit Expense" : "Add Expense"}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date" 
              type="date"
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input 
              id="amount" 
              type="number" 
              step="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0.00" 
              required 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Where/What)</Label>
          <Input 
            id="description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="e.g. Trader Joe's, Coffee" 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            className="flex h-11 w-full rounded-sm border border-gray-300 bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="pt-4 flex items-center justify-between gap-2 border-t border-gray-100 mt-6">
          {expenseToEdit ? (
            <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="hidden sm:inline-flex">Cancel</Button>
            <Button type="submit">Save Expense</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
