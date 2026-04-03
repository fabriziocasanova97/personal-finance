import { supabase } from './supabase';
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

  const [
    { data: expenses },
    { data: fixedCosts },
    { data: savings },
    { data: budgets },
    { data: settings },
  ] = await Promise.all([
    supabase.from('expenses').select('*'),
    supabase.from('fixed_costs').select('*'),
    supabase.from('savings').select('*'),
    supabase.from('budgets').select('*'),
    supabase.from('user_settings').select('ideal_expenses, ideal_savings').maybeSingle(),
  ]);

  return {
    expenses: expenses || [],
    fixedCosts: (fixedCosts || []).map(fc => ({ ...fc, monthsLeft: fc.months_left ?? null })), // mapped property? (ignoring enddate mapping if not present)
    savings: savings || [],
    budgets: budgets || [],
    idealExpenses: settings?.ideal_expenses || {},
    idealSavings: settings?.ideal_savings || {},
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
    enddate: cost.monthsLeft ? new Date(new Date().setMonth(new Date().getMonth() + cost.monthsLeft)).toISOString() : null,
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
        enddate: fc.monthsLeft ? new Date(new Date().setMonth(new Date().getMonth() + fc.monthsLeft)).toISOString() : null,
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
