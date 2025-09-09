-- Drop the old integer version of consume_credits function
DROP FUNCTION IF EXISTS public.consume_credits(p_user_id uuid, p_credits integer, p_description text);

-- Drop the old integer version of add_credits function  
DROP FUNCTION IF EXISTS public.add_credits(p_user_id uuid, p_credits integer, p_type text, p_description text, p_stripe_session_id text, p_amount_paid numeric, p_currency text);