"use client";

import { useState, useEffect } from "react";
import { useStore, Savings } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { dbInsertSavings, dbDeleteSavings } from "@/lib/db";
import { reportSyncError } from "@/lib/toast";

type GoalType = 'Emergency Fund' | 'Tax Savings' | 'HYS Account';

interface AddContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contributionToEdit?: Savings | null;
  defaultGoal?: GoalType;
}

export const SAVINGS_GOALS: GoalType[] = [
  "Emergency Fund",
  "Tax Savings",
  "HYS Account"
];

export function AddContributionModal({ isOpen, onClose, contributionToEdit, defaultGoal }: AddContributionModalProps) {
  const { savings, setSavings } = useStore();
  
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [goal, setGoal] = useState<GoalType>(defaultGoal || SAVINGS_GOALS[0]);

  useEffect(() => {
    if (contributionToEdit && isOpen) {
      setAmount(contributionToEdit.amount.toString());
      setDate(contributionToEdit.date);
      setNote(contributionToEdit.note || "");
      setGoal(contributionToEdit.goal);
    } else if (isOpen) {
      setAmount("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setNote("");
      setGoal(defaultGoal || SAVINGS_GOALS[0]);
    }
  }, [contributionToEdit, isOpen, defaultGoal]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    
    if (isNaN(val) || !date || !goal) return;

    const newContribution: Savings = {
      id: contributionToEdit ? contributionToEdit.id : crypto.randomUUID(),
      user_id: "temp-user",
      amount: val,
      date,
      note: note.trim() === "" ? null : note,
      goal,
    };

    if (contributionToEdit) {
      setSavings(savings.map(s => s.id === contributionToEdit.id ? newContribution : s));
    } else {
      setSavings([...savings, newContribution]);
    }
    
    // Background cloud sync
    dbInsertSavings(newContribution).catch(reportSyncError('contribution'));

    onClose();
  };

  const handleDelete = () => {
    if (contributionToEdit) {
      setSavings(savings.filter(s => s.id !== contributionToEdit.id));
      dbDeleteSavings(contributionToEdit.id).catch(reportSyncError('deletion'));
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contributionToEdit ? "Edit Contribution" : "Add Contribution"}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="goal">Savings Goal</Label>
          <select
            id="goal"
            className="flex h-11 w-full rounded-sm border border-gray-300 bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            value={goal}
            onChange={(e) => setGoal(e.target.value as GoalType)}
            required
            disabled={!!contributionToEdit} // Don't let them change the goal of an existing contribution easily
          >
            {SAVINGS_GOALS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

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
          <Label htmlFor="note">Note (Optional)</Label>
          <Input 
            id="note" 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            placeholder="e.g. Monthly transfer, Bonus" 
          />
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-gray-100 mt-6">
          {contributionToEdit ? (
            <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          ) : <div />}
          <div className="space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Contribution</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
