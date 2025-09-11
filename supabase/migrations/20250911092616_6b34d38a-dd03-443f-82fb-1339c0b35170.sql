-- Add CHECK constraint to user_input column in storyboard_jobs table
ALTER TABLE storyboard_jobs 
ADD CONSTRAINT check_user_input_structure 
CHECK (
  -- Check that user_input is a valid JSON object
  jsonb_typeof(user_input) = 'object'
  
  -- Check required root fields
  AND user_input ? 'size'
  AND user_input ? 'accent' 
  AND user_input ? 'genres'
  AND user_input ? 'language'
  AND user_input ? 'template'
  AND user_input ? 'characters'
  
  -- Check that size is valid
  AND user_input->>'size' IN ('portrait', 'landscape')
  
  -- Check that language is valid
  AND user_input->>'language' IN ('English', 'Arabic')
  
  -- Check that genres is an array with 1-3 items
  AND jsonb_typeof(user_input->'genres') = 'array'
  AND jsonb_array_length(user_input->'genres') BETWEEN 1 AND 3
  
  -- Check characters structure
  AND jsonb_typeof(user_input->'characters') = 'object'
  AND user_input->'characters' ? 'lead'
  AND jsonb_typeof(user_input->'characters'->'lead') = 'object'
  
  -- Check lead character required fields
  AND user_input->'characters'->'lead' ? 'name'
  AND user_input->'characters'->'lead' ? 'gender'
  AND user_input->'characters'->'lead'->>'name' != ''
  AND user_input->'characters'->'lead'->>'gender' IN ('male', 'female')
  
  -- Check supporting character structure if it exists
  AND (
    NOT (user_input->'characters' ? 'supporting')
    OR (
      jsonb_typeof(user_input->'characters'->'supporting') = 'object'
      AND user_input->'characters'->'supporting' ? 'name'
      AND user_input->'characters'->'supporting' ? 'gender'
      AND user_input->'characters'->'supporting'->>'name' != ''
      AND user_input->'characters'->'supporting'->>'gender' IN ('male', 'female')
    )
  )
);