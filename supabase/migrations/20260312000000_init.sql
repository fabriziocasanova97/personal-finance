-- 1. Create Tables

CREATE TABLE income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  weekly_amount numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE fixed_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  type text NOT NULL CHECK (type IN ('fixed', 'debt')),
  enddate date
);

CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL
);

CREATE TABLE savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  goal text NOT NULL CHECK (goal IN ('Emergency Fund', 'Tax Savings', 'HYS Account')),
  amount numeric NOT NULL,
  date date NOT NULL,
  note text
);

CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies (auth.uid() = user_id for all CRUD operations)

-- Income Policies
CREATE POLICY "Users can manage their own income" ON income
  FOR ALL USING (auth.uid() = user_id);

-- Fixed Costs Policies
CREATE POLICY "Users can manage their own fixed costs" ON fixed_costs
  FOR ALL USING (auth.uid() = user_id);

-- Expenses Policies
CREATE POLICY "Users can manage their own expenses" ON expenses
  FOR ALL USING (auth.uid() = user_id);

-- Savings Policies
CREATE POLICY "Users can manage their own savings" ON savings
  FOR ALL USING (auth.uid() = user_id);

-- Budgets Policies
CREATE POLICY "Users can manage their own budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);
