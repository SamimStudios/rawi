-- Drop existing consume_credits function variations
DROP FUNCTION IF EXISTS public.consume_credits(uuid, numeric, text, uuid, text);
DROP FUNCTION IF EXISTS public.consume_credits(uuid, numeric, text);

-- Create updated consume_credits function with job_id and function_id support
CREATE OR REPLACE FUNCTION public.consume_credits(
  p_user_id uuid,
  p_credits numeric,
  p_description text DEFAULT 'Credit consumption',
  p_job_id uuid DEFAULT NULL,
  p_function_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_credits NUMERIC(10,2);
  rounded_credits NUMERIC(10,2);
BEGIN
  -- Round up to 2 decimal places
  rounded_credits := CEIL(p_credits * 100.0) / 100.0;
  
  -- Get current credits with row lock
  SELECT credits INTO current_credits 
  FROM public.user_credits 
  WHERE user_id = p_user_id 
  FOR UPDATE;
  
  -- Check if user has enough credits
  IF current_credits IS NULL OR current_credits < rounded_credits THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE public.user_credits 
  SET credits = credits - rounded_credits, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record transaction with job_id and function_id in metadata
  INSERT INTO public.transactions (
    user_id, 
    type, 
    credits_amount, 
    description,
    metadata
  )
  VALUES (
    p_user_id, 
    'consumption', 
    -rounded_credits, 
    p_description,
    CASE 
      WHEN p_job_id IS NOT NULL OR p_function_id IS NOT NULL 
      THEN jsonb_build_object(
        'job_id', p_job_id,
        'function_id', p_function_id
      )
      ELSE NULL
    END
  );
  
  RETURN TRUE;
END;
$$;