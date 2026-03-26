"use client";

import { useState, useEffect } from "react";
import { useStore, Expense } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

export const EXPENSE_CATEGORIES = [
  "Groceries",
  "Dining Out",
  "Coffee/Snacks",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Health",
  "Personal Care",
  "Dominion energy",
  "Washington gas",
  "Other"
];

export function AddExpenseModal({ isOpen, onClose, expenseToEdit }: AddExpenseModalProps) {
  const { expenses, setExpenses } = useStore();
  
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);

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

    const newExpense: Expense = {
      id: expenseToEdit ? expenseToEdit.id : crypto.randomUUID(),
      user_id: "temp-user",
      amount: val,
      date,
      description,
      category,
    };

    if (expenseToEdit) {
      setExpenses(expenses.map(exp => exp.id === expenseToEdit.id ? newExpense : exp));
    } else {
      setExpenses([...expenses, newExpense]);
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (expenseToEdit) {
      setExpenses(expenses.filter(exp => exp.id !== expenseToEdit.id));
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
        <div className="grid grid-cols-2 gap-4">
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
              autoFocus={!expenseToEdit}
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
            className="flex h-9 w-full rounded-sm border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-gray-100 mt-6">
          {expenseToEdit ? (
            <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          ) : <div />}
          <div className="space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Expense</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
