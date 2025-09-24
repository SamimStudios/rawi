-- CRITICAL SECURITY FIXES - Corrected Version

-- 1. Enable RLS on fal_requests table and add user-specific access policies
ALTER TABLE public.fal_requests ENABLE ROW LEVEL SECURITY;

-- Add user_id column to fal_requests if it doesn't exist
ALTER TABLE public.fal_requests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create policies for fal_requests - users can only access their own requests
CREATE POLICY "Users can view their own AI requests" 
ON public.fal_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI requests" 
ON public.fal_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI requests" 
ON public.fal_requests 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all requests" 
ON public.fal_requests 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- 2. Fix critical functions with mutable search paths
CREATE OR REPLACE FUNCTION public.consume_credits(p_user_id uuid, p_credits numeric, p_description text DEFAULT 'Credit consumption'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits NUMERIC(10,2);
  rounded_credits NUMERIC(10,2);
BEGIN
  -- Round up to 2 decimal places (e.g., 0.032 becomes 0.04)
  rounded_credits := CEIL(p_credits * 100.0) / 100.0;
  
  -- Get current credits with row lock
  SELECT credits INTO current_credits 
  FROM user_credits 
  WHERE user_id = p_user_id 
  FOR UPDATE;
  
  -- Check if user has enough credits
  IF current_credits IS NULL OR current_credits < rounded_credits THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE user_credits 
  SET credits = credits - rounded_credits, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO transactions (user_id, type, credits_amount, description)
  VALUES (p_user_id, 'consumption', -rounded_credits, p_description);
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_credits(p_user_id uuid, p_credits numeric, p_type text DEFAULT 'purchase'::text, p_description text DEFAULT 'Credit purchase'::text, p_stripe_session_id text DEFAULT NULL::text, p_amount_paid numeric DEFAULT NULL::numeric, p_currency text DEFAULT 'AED'::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rounded_credits NUMERIC(10,2);
BEGIN
  -- Round up to 2 decimal places for consistency
  rounded_credits := CEIL(p_credits * 100.0) / 100.0;
  
  -- Insert or update user credits
  INSERT INTO user_credits (user_id, credits)
  VALUES (p_user_id, rounded_credits)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    credits = user_credits.credits + rounded_credits,
    updated_at = now();
  
  -- Record transaction
  INSERT INTO transactions (
    user_id, type, credits_amount, description, 
    stripe_session_id, amount_paid, currency
  )
  VALUES (
    p_user_id, p_type, rounded_credits, p_description,
    p_stripe_session_id, p_amount_paid, p_currency
  );
END;
$$;

-- 3. Create security audit function for sensitive operations
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values,
    current_setting('request.headers', true)::json->>'x-real-ip',
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$;