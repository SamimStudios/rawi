-- Drop and recreate add_credits function with explicit schema references
DROP FUNCTION IF EXISTS public.add_credits(uuid, numeric, text, text, text, numeric, text);

CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id uuid,
  p_credits numeric,
  p_type text,
  p_description text DEFAULT NULL,
  p_stripe_session_id text DEFAULT NULL,
  p_amount_paid numeric DEFAULT NULL,
  p_currency text DEFAULT 'AED',
  p_stripe_payment_intent_id text DEFAULT NULL,
  p_stripe_subscription_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id uuid;
  v_current_credits numeric;
BEGIN
  -- Get current credits or initialize to 0
  SELECT credits INTO v_current_credits
  FROM public.user_credits
  WHERE user_id = p_user_id;

  IF v_current_credits IS NULL THEN
    -- Create user_credits record if it doesn't exist
    INSERT INTO public.user_credits (user_id, credits)
    VALUES (p_user_id, p_credits)
    RETURNING credits INTO v_current_credits;
  ELSE
    -- Update existing credits
    UPDATE public.user_credits
    SET credits = credits + p_credits,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING credits INTO v_current_credits;
  END IF;

  -- Insert transaction record
  INSERT INTO public.transactions (
    user_id,
    type,
    credits_amount,
    description,
    stripe_session_id,
    amount_paid,
    currency,
    stripe_payment_intent_id,
    stripe_subscription_id,
    metadata
  )
  VALUES (
    p_user_id,
    p_type,
    p_credits,
    p_description,
    p_stripe_session_id,
    p_amount_paid,
    p_currency,
    p_stripe_payment_intent_id,
    p_stripe_subscription_id,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;