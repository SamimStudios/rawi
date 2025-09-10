-- Update the generate-movie-info function to expect empty success response
UPDATE n8n_functions 
SET success_response_schema = '{
  "type": "object",
  "title": "EmptySuccessResponse",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "required": [],
  "properties": {},
  "additionalProperties": false
}'::jsonb
WHERE name = 'generate-movie-info';