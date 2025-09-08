-- Create user credits table
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create transactions table for all credit activities
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'purchase', 'consumption', 'refund', 'subscription_credit'
  credits_amount INTEGER NOT NULL, -- positive for additions, negative for consumption
  currency TEXT NOT NULL DEFAULT 'AED',
  amount_paid DECIMAL(10,2), -- actual amount paid in currency
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits_per_week INTEGER NOT NULL,
  price_aed DECIMAL(10,2) NOT NULL,
  price_sar DECIMAL(10,2) NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  stripe_price_id_aed TEXT,
  stripe_price_id_sar TEXT,
  stripe_price_id_usd TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create credit packages table
CREATE TABLE public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_aed DECIMAL(10,2) NOT NULL,
  price_sar DECIMAL(10,2) NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  stripe_price_id_aed TEXT,
  stripe_price_id_sar TEXT,
  stripe_price_id_usd TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  transaction_id UUID REFERENCES public.transactions(id),
  stripe_invoice_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert/update credits" ON public.user_credits
  FOR ALL USING (true);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (active = true);

-- RLS Policies for credit_packages (public read)
CREATE POLICY "Anyone can view credit packages" ON public.credit_packages
  FOR SELECT USING (active = true);

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert/update invoices" ON public.invoices
  FOR ALL USING (true);

-- Create function to consume credits
CREATE OR REPLACE FUNCTION public.consume_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_description TEXT DEFAULT 'Credit consumption'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO current_credits 
  FROM user_credits 
  WHERE user_id = p_user_id 
  FOR UPDATE;
  
  -- Check if user has enough credits
  IF current_credits IS NULL OR current_credits < p_credits THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE user_credits 
  SET credits = credits - p_credits, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO transactions (user_id, type, credits_amount, description)
  VALUES (p_user_id, 'consumption', -p_credits, p_description);
  
  RETURN TRUE;
END;
$$;

-- Create function to add credits
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_type TEXT DEFAULT 'purchase',
  p_description TEXT DEFAULT 'Credit purchase',
  p_stripe_session_id TEXT DEFAULT NULL,
  p_amount_paid DECIMAL DEFAULT NULL,
  p_currency TEXT DEFAULT 'AED'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update user credits
  INSERT INTO user_credits (user_id, credits)
  VALUES (p_user_id, p_credits)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    credits = user_credits.credits + p_credits,
    updated_at = now();
  
  -- Record transaction
  INSERT INTO transactions (
    user_id, type, credits_amount, description, 
    stripe_session_id, amount_paid, currency
  )
  VALUES (
    p_user_id, p_type, p_credits, p_description,
    p_stripe_session_id, p_amount_paid, p_currency
  );
END;
$$;

-- Insert default subscription plans
INSERT INTO subscription_plans (name, credits_per_week, price_aed, price_sar, price_usd) VALUES
('Creator Weekly', 100, 100.00, 100.00, 27.00),
('Pro Weekly', 250, 200.00, 200.00, 54.00),
('Studio Weekly', 500, 350.00, 350.00, 95.00);

-- Insert default credit packages
INSERT INTO credit_packages (name, credits, price_aed, price_sar, price_usd) VALUES
('Starter Pack', 50, 50.00, 50.00, 14.00),
('Standard Pack', 100, 100.00, 100.00, 27.00),
('Pro Pack', 250, 250.00, 250.00, 68.00),
('Studio Pack', 500, 500.00, 500.00, 135.00);

-- Create updated_at triggers
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();