-- Fix the trigger function to use the correct column name
CREATE OR REPLACE FUNCTION public.update_input_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update user_input_updated_at if user_input has actually changed
  IF OLD.user_input IS DISTINCT FROM NEW.user_input THEN
    NEW.user_input_updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;