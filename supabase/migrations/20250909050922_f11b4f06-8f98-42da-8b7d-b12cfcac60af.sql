-- Update user_credits table to support fractional credits
ALTER TABLE user_credits ALTER COLUMN credits TYPE numeric(10,2);

-- Update transactions table to support fractional credits  
ALTER TABLE transactions ALTER COLUMN credits_amount TYPE numeric(10,2);

-- Update consume_credits function to support fractional credits with rounding
CREATE OR REPLACE FUNCTION public.consume_credits(p_user_id uuid, p_credits numeric, p_description text DEFAULT 'Credit consumption'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Update add_credits function to support fractional credits
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id uuid, p_credits numeric, p_type text DEFAULT 'purchase'::text, p_description text DEFAULT 'Credit purchase'::text, p_stripe_session_id text DEFAULT NULL::text, p_amount_paid numeric DEFAULT NULL::numeric, p_currency text DEFAULT 'AED'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;