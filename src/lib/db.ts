import { supabase } from './supabase';
import { differenceInCalendarMonths } from 'date-fns';
import { Expense, FixedCost, Savings, Budget, Income } from './store';

/**
 * Validates the user session and returns user id
 */
export async function getUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user.id;
}

export const dbFetchAll = async () => {
  const userId = await getUserId();
  if (!userId) return null;

  const [expensesRes, fixedCostsRes, savingsRes, budgetsRes, incomeRes, settingsRes] = await Promise.all([
    supabase.from('expenses').select('*'),
    supabase.from('fixed_costs').select('*'),
    supabase.from('savings').select('*'),
    supabase.from('budgets').select('*'),
    supabase.from('income').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('user_settings').select('ideal_expenses, ideal_savings').maybeSingle(),
  ]);

  // If any core read failed, the cloud state is unknown — callers must keep
  // local data instead of treating this as "cloud is empty" (data-loss bug H2).
  const readError = expensesRes.error || fixedCostsRes.error || savingsRes.error || budgetsRes.error || incomeRes.error;
  if (readError) {
    console.error('dbFetchAll failed, keeping local data:', readError);
    return null;
  }

  return {
    expenses: expensesRes.data || [],
    // The DB stores the durable `enddate`; the app works with time-relative
    // `monthsLeft`, so derive it on read (0 = paid off, clamped) (H5).
    fixedCosts: (fixedCostsRes.data || []).map(({ enddate, ...fc }) => ({
      ...fc,
      monthsLeft: enddate ? Math.max(0, differenceInCalendarMonths(new Date(enddate), new Date())) : null,
    })),
    savings: savingsRes.data || [],
    budgets: budgetsRes.data || [],
    income: incomeRes.data as Income | null,
    idealExpenses: settingsRes.data?.ideal_expenses || {},
    idealSavings: settingsRes.data?.ideal_savings || {},
  };
};

export const dbUpsertSettings = async (idealExpenses: Record<string, string>, idealSavings: Record<string, string>) => {
  const userId = await getUserId();
  if (!userId) return;

  await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, ideal_expenses: idealExpenses, ideal_savings: idealSavings, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    ).throwOnError();
};

export const dbUpsertIncome = async (income: Income) => {
  const userId = await getUserId();
  if (!userId) return;

  return supabase.from('income').upsert({
    id: income.id,
    user_id: userId,
    weekly_amount: income.weekly_amount,
    updated_at: new Date().toISOString(),
  }).throwOnError();
};

export const dbUpsertBudget = async (budget: Budget) => {
  const userId = await getUserId();
  if (!userId) return;

  return supabase.from('budgets').upsert({
    id: budget.id,
    user_id: userId,
    category: budget.category,
    amount: budget.amount,
  }).throwOnError();
};

export const dbDeleteBudget = async (id: string) => {
  return supabase.from('budgets').delete().eq('id', id).throwOnError();
};

export const dbInsertExpense = async (expense: Expense) => {
  const userId = await getUserId();
  if (!userId) return;

  return supabase.from('expenses').upsert({
    id: expense.id,
    user_id: userId,
    date: expense.date,
    description: expense.description,
    category: expense.category,
    amount: expense.amount
  }).throwOnError();
};

export const dbDeleteExpense = async (id: string) => {
  return supabase.from('expenses').delete().eq('id', id).throwOnError();
};

export const dbUpsertFixedCost = async (cost: FixedCost) => {
  const userId = await getUserId();
  if (!userId) return;

  return supabase.from('fixed_costs').upsert({
    id: cost.id,
    user_id: userId,
    name: cost.name,
    amount: cost.amount,
    category: cost.category,
    type: cost.type,
    // != null so a paid-off debt (monthsLeft 0) keeps its enddate instead of null (H5)
    enddate: cost.monthsLeft != null ? new Date(new Date().setMonth(new Date().getMonth() + cost.monthsLeft)).toISOString() : null,
  }).throwOnError();
};

export const dbDeleteFixedCost = async (id: string) => {
  return supabase.from('fixed_costs').delete().eq('id', id).throwOnError();
};

export const dbInsertSavings = async (savings: Savings) => {
  const userId = await getUserId();
  if (!userId) return;

  return supabase.from('savings').upsert({
    id: savings.id,
    user_id: userId,
    goal: savings.goal,
    amount: savings.amount,
    date: savings.date,
    note: savings.note
  }).throwOnError();
};

export const dbDeleteSavings = async (id: string) => {
  return supabase.from('savings').delete().eq('id', id).throwOnError();
};

// Full sync method to be used by DataSync
export const dbOverwriteCloudWithLocal = async (localState: any) => {
  const userId = await getUserId();
  if (!userId || !localState) return;

  try {
    // 0. Income and budgets
    if (localState.income) {
      await supabase.from('income').upsert({
        id: localState.income.id,
        user_id: userId,
        weekly_amount: localState.income.weekly_amount,
        updated_at: localState.income.updated_at || new Date().toISOString(),
      }).throwOnError();
    }
    if (localState.budgets?.length > 0) {
      const budgetsToInsert = localState.budgets.map((b: any) => ({
        id: b.id,
        user_id: userId,
        category: b.category,
        amount: b.amount,
      }));
      await supabase.from('budgets').upsert(budgetsToInsert, { onConflict: 'id' }).throwOnError();
    }

    // 1. Settings
    if (localState.idealExpenses || localState.idealSavings) {
      // Intentionally not blocking on settings failure in case migration wasn't run
      await dbUpsertSettings(localState.idealExpenses || {}, localState.idealSavings || {}).catch(e => console.warn('Settings upsert failed:', e));
    }
    
    // 2. Expenses
    if (localState.expenses?.length > 0) {
      const expensesToInsert = localState.expenses.map((e: any) => ({
        id: e.id,
        user_id: userId,
        date: e.date,
        description: e.description,
        category: e.category,
        amount: e.amount
      }));
      await supabase.from('expenses').upsert(expensesToInsert, { onConflict: 'id' }).throwOnError();
    }

    // 3. Fixed Costs
    if (localState.fixedCosts?.length > 0) {
      const fcToInsert = localState.fixedCosts.map((fc: any) => ({
        id: fc.id,
        user_id: userId,
        name: fc.name,
        amount: fc.amount,
        category: fc.category,
        type: fc.type,
        enddate: fc.monthsLeft != null ? new Date(new Date().setMonth(new Date().getMonth() + fc.monthsLeft)).toISOString() : null,
      }));
      await supabase.from('fixed_costs').upsert(fcToInsert, { onConflict: 'id' }).throwOnError();
    }

    // 4. Savings
    if (localState.savings?.length > 0) {
       const svToInsert = localState.savings.map((s: any) => ({
         id: s.id,
         user_id: userId,
         goal: s.goal,
         amount: s.amount,
         date: s.date,
         note: s.note || null
       }));
       await supabase.from('savings').upsert(svToInsert, { onConflict: 'id' }).throwOnError();
    }
    
    return true;
  } catch (error) {
    console.error('Error overwriting cloud data:', error);
    throw error;
  }
};
