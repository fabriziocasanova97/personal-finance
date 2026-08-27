"use client";

import { useState, useEffect } from "react";
import { useStore, FixedCost } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { dbUpsertFixedCost, dbDeleteFixedCost } from "@/lib/db";
import { reportSyncError } from "@/lib/toast";

interface FixedCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  costToEdit: FixedCost | null;
  typeFilter: 'fixed' | 'debt';
}

const FIXED_COST_CATEGORIES = ["Rent / Mortgage", "Transportation", "Utilities", "Insurance", "Subscription", "Pets", "Other"];
const DEBT_CATEGORIES = ["Medical Debt", "Credit Card", "Loan", "Tax Payment", "Other"];

export function FixedCostModal({ isOpen, onClose, costToEdit, typeFilter }: FixedCostModalProps) {
  const { fixedCosts, setFixedCosts } = useStore();
  
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [monthsLeft, setMonthsLeft] = useState("");

  const categories = typeFilter === 'debt' ? DEBT_CATEGORIES : FIXED_COST_CATEGORIES;

  useEffect(() => {
    if (costToEdit && isOpen) {
      setName(costToEdit.name);
      setAmount(costToEdit.amount.toString());
      setCategory(costToEdit.category);
      setMonthsLeft(costToEdit.monthsLeft?.toString() || "");
    } else if (isOpen) {
      setName("");
      setAmount("");
      setCategory(categories[0]);
      setMonthsLeft("");
    }
  }, [costToEdit, isOpen, categories]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    
    if (!name || isNaN(val)) return;
    if (typeFilter === 'debt' && !monthsLeft) return; // DB constraints

    const newCost: FixedCost = {
      id: costToEdit ? costToEdit.id : crypto.randomUUID(),
      user_id: "temp-user",
      name,
      amount: val,
      category,
      type: typeFilter,
      monthsLeft: typeFilter === 'debt' ? parseInt(monthsLeft) : null
    };

    if (costToEdit) {
      setFixedCosts(fixedCosts.map(c => c.id === costToEdit.id ? newCost : c));
    } else {
      setFixedCosts([...fixedCosts, newCost]);
    }
    
    // Background cloud sync
    dbUpsertFixedCost(newCost).catch(reportSyncError('fixed cost'));

    onClose();
  };

  const handleDelete = () => {
    if (costToEdit) {
      setFixedCosts(fixedCosts.filter(c => c.id !== costToEdit.id));
      dbDeleteFixedCost(costToEdit.id).catch(reportSyncError('deletion'));
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={costToEdit ? `Edit ${typeFilter === 'fixed' ? 'Fixed Cost' : 'Debt'}` : `Add ${typeFilter === 'fixed' ? 'Fixed Cost' : 'Debt'}`}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="e.g. Netflix" 
            required 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monthly Amount</Label>
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

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-11 w-full rounded-sm border border-gray-300 bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {typeFilter === 'debt' && (
          <div className="space-y-2">
            <Label htmlFor="monthsLeft">Months left to pay off debt <span className="text-red-500">*</span></Label>
            <Input 
              id="monthsLeft" 
              type="number" 
              min="1"
              value={monthsLeft} 
              onChange={(e) => setMonthsLeft(e.target.value)} 
              required 
            />
          </div>
        )}

        <div className="pt-4 flex items-center justify-between border-t border-gray-100 mt-6">
          {costToEdit ? (
            <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          ) : <div />}
          <div className="space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
