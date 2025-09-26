-- Enable RLS on the new credits tables
ALTER TABLE app.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_credits
CREATE POLICY "Users can view their own credits" ON app.user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage user credits" ON app.user_credits
  FOR ALL USING (true);

-- Create RLS policies for credit_transactions  
CREATE POLICY "Users can view their own transactions" ON app.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON app.credit_transactions
  FOR INSERT WITH CHECK (true);