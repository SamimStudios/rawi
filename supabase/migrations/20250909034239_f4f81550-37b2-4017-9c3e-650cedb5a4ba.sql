-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION update_input_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update input_updated_at if user_input has actually changed
  IF OLD.user_input IS DISTINCT FROM NEW.user_input THEN
    NEW.input_updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;