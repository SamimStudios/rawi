-- Create function to get n8n function pricing data
CREATE OR REPLACE FUNCTION public.get_function_pricing()
RETURNS TABLE(id text, price_in_credits numeric)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id::text, price_in_credits
  FROM app.n8n_functions
  WHERE active = true;
$$;