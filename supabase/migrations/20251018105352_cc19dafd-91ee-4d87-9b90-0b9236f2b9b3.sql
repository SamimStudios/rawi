-- Create RPC function to add plan credits (separate from top-up credits)
CREATE OR REPLACE FUNCTION public.add_plan_credits(
  p_user_id uuid,
  p_credits numeric,
  p_expire_at timestamp with time zone,
  p_description text DEFAULT 'Plan credits added',
  p_stripe_subscription_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_transaction_id uuid;
BEGIN
  -- Update user_credits with plan credits
  INSERT INTO public.user_credits (user_id, plan_credits, topup_credits, credits, plan_credits_expire_at)
  VALUES (p_user_id, p_credits, 0, p_credits, p_expire_at)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan_credits = p_credits,
    plan_credits_expire_at = p_expire_at,
    credits = p_credits + user_credits.topup_credits,
    updated_at = now();

  -- Record transaction
  INSERT INTO public.transactions (
    user_id,
    type,
    credits_amount,
    description,
    currency,
    stripe_subscription_id,
    metadata
  )
  VALUES (
    p_user_id,
    'subscription',
    p_credits,
    p_description,
    'AED',
    p_stripe_subscription_id,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;