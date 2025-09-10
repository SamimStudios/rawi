-- Ensure the trigger function exists and is correct
CREATE OR REPLACE FUNCTION public.update_input_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update input_updated_at if user_input has actually changed
  IF OLD.user_input IS DISTINCT FROM NEW.user_input THEN
    NEW.input_updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger if it doesn't exist (safe to re-run)
DROP TRIGGER IF EXISTS update_storyboard_jobs_input_updated_at ON storyboard_jobs;
CREATE TRIGGER update_storyboard_jobs_input_updated_at
  BEFORE UPDATE ON storyboard_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_input_updated_at();