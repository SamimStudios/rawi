-- Add input_updated_at column to track when user input was last modified
ALTER TABLE storyboard_jobs 
ADD COLUMN input_updated_at timestamp with time zone;

-- Create trigger to automatically update input_updated_at when user_input is modified
CREATE OR REPLACE FUNCTION update_input_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update input_updated_at if user_input has actually changed
  IF OLD.user_input IS DISTINCT FROM NEW.user_input THEN
    NEW.input_updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on storyboard_jobs table
CREATE TRIGGER trigger_update_input_updated_at
  BEFORE UPDATE ON storyboard_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_input_updated_at();