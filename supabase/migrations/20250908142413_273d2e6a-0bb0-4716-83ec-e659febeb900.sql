-- Update credit_packages with new pricing structure
UPDATE credit_packages SET 
  credits = 20, 
  price_aed = 20, 
  price_sar = 20, 
  price_usd = 5.40,
  name = '20 Credits'
WHERE name = '50 Credits';

UPDATE credit_packages SET 
  credits = 50, 
  price_aed = 45, 
  price_sar = 45, 
  price_usd = 12.15,
  name = '50 Credits (10% off)'
WHERE name = '100 Credits';

UPDATE credit_packages SET 
  credits = 100, 
  price_aed = 80, 
  price_sar = 80, 
  price_usd = 21.60,
  name = '100 Credits (20% off)'
WHERE name = '250 Credits';

UPDATE credit_packages SET 
  credits = 250, 
  price_aed = 175, 
  price_sar = 175, 
  price_usd = 47.25,
  name = '250 Credits (30% off)'
WHERE name = '500 Credits';

-- Update subscription_plans with new pricing structure  
UPDATE subscription_plans SET 
  credits_per_week = 20, 
  price_aed = 18, 
  price_sar = 18, 
  price_usd = 4.86,
  name = 'Starter Weekly (20 cr)'
WHERE name = 'Basic Plan';

UPDATE subscription_plans SET 
  credits_per_week = 50, 
  price_aed = 40, 
  price_sar = 40, 
  price_usd = 10.80,
  name = 'Creator Weekly (50 cr)'
WHERE name = 'Premium Plan';

UPDATE subscription_plans SET 
  credits_per_week = 100, 
  price_aed = 70, 
  price_sar = 70, 
  price_usd = 18.90,
  name = 'Pro Weekly (100 cr)'
WHERE name = 'Enterprise Plan';

-- Add new Studio Weekly plan
INSERT INTO subscription_plans (name, credits_per_week, price_aed, price_sar, price_usd, active)
VALUES ('Studio Weekly (250 cr)', 250, 150, 150, 40.50, true);

-- Create rewards table for configurable bonuses
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  reward_type TEXT NOT NULL, -- 'signup_bonus', 'referral', 'milestone', etc.
  credits_amount INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB, -- flexible conditions for different reward types
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on rewards table
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Policy for viewing rewards (admin only for now)
CREATE POLICY "System can manage rewards" ON public.rewards
FOR ALL
USING (true);

-- Insert initial signup bonus reward
INSERT INTO rewards (name, description, reward_type, credits_amount, conditions)
VALUES (
  'Welcome Bonus',
  'Credits awarded when a new user signs up',
  'signup_bonus',
  5,
  '{"automatic": true, "one_time": true}'
);

-- Create trigger for updated_at on rewards
CREATE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();