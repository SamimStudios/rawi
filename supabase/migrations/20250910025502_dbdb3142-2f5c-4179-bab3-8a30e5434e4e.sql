-- Fix existing jobs that have null input_updated_at but have user_input data
-- Set it to the created_at timestamp since that's when the input was first created
UPDATE storyboard_jobs 
SET input_updated_at = created_at 
WHERE input_updated_at IS NULL 
  AND user_input IS NOT NULL 
  AND user_input != '{}';

-- Also update specific job if it still has null
UPDATE storyboard_jobs 
SET input_updated_at = created_at 
WHERE id = '9b9e99ea-0019-4a42-a33b-10af1b416643' 
  AND input_updated_at IS NULL;