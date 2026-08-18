import { useStore, Expense } from "@/lib/store";
import { dbInsertExpense } from "@/lib/db";

export function addExpense(input: {
  amount: number;
  description: string;
  category: string;
  date: string;
}): Expense {
  const newExpense: Expense = {
    id: crypto.randomUUID(),
    user_id: "temp-user",
    ...input,
  };

  const { expenses, setExpenses } = useStore.getState();
  setExpenses([...expenses, newExpense]);

  // Background cloud sync
  dbInsertExpense(newExpense).catch(console.error);

  return newExpense;
}
