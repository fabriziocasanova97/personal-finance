import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Based on schema requirements
export interface Income {
  id: string;
  user_id: string;
  weekly_amount: number;
  updated_at: string;
}

export interface FixedCost {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string;
  type: 'fixed' | 'debt';
  monthsLeft?: number | null;
}

export interface Expense {
  id: string;
  user_id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}

export interface Savings {
  id: string;
  user_id: string;
  goal: 'Emergency Fund' | 'Tax Savings' | 'HYS Account';
  amount: number;
  date: string;
  note: string | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
}

interface FinClearState {
  income: Income | null;
  fixedCosts: FixedCost[];
  expenses: Expense[];
  savings: Savings[];
  budgets: Budget[];
  idealExpenses: Record<string, string>;
  idealSavings: Record<string, string>;
  // Monthly Review: indices (0-11) of the months shown. Persisted locally and synced to user_settings.
  selectedMonths: number[];

  // Actions
  setIncome: (income: Income | null) => void;
  setFixedCosts: (costs: FixedCost[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setSavings: (savings: Savings[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  setIdealExpenses: (idealExpenses: Record<string, string>) => void;
  setIdealSavings: (idealSavings: Record<string, string>) => void;
  setSelectedMonths: (selectedMonths: number[]) => void;
}

export const useStore = create<FinClearState>()(
  persist(
    (set) => ({
      income: null,
      fixedCosts: [],
      expenses: [],
      savings: [],
      budgets: [],
      idealExpenses: {},
      idealSavings: {},
      selectedMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],

      setIncome: (income) => set({ income }),
      setFixedCosts: (fixedCosts) => set({ fixedCosts }),
      setExpenses: (expenses) => set({ expenses }),
      setSavings: (savings) => set({ savings }),
      setBudgets: (budgets) => set({ budgets }),
      setIdealExpenses: (idealExpenses) => set({ idealExpenses }),
      setIdealSavings: (idealSavings) => set({ idealSavings }),
      setSelectedMonths: (selectedMonths) => set({ selectedMonths }),
    }),
    {
      name: 'finclear_data', // storage name
      storage: createJSONStorage(() => localStorage), // use localStorage
    }
  )
);
