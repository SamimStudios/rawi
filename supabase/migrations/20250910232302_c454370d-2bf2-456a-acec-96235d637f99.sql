-- Add N8N functions for character generation workflow
INSERT INTO n8n_functions (name, description, type, price, expected_schema, success_response_schema, production_webhook, test_webhook, active) VALUES
(
  'generate-character-description',
  'Generate detailed character description including age range, ethnicity, body features, personality, etc.',
  'character_processing',
  2.5,
  '{"job_id": "uuid", "table_id": "uuid", "character_key": "string"}',
  '{"success": "boolean", "message": "string"}',
  NULL,
  NULL,
  true
),
(
  'validate-character-description', 
  'Validate and refine character description based on user edits',
  'character_processing',
  1.5,
  '{"job_id": "uuid", "table_id": "uuid", "character_key": "string", "description_data": "object"}',
  '{"success": "boolean", "message": "string"}',
  NULL,
  NULL,
  true
),
(
  'generate-character-portrait',
  'Generate character portrait image based on description and face reference',
  'character_processing', 
  3.0,
  '{"job_id": "uuid", "table_id": "uuid", "character_key": "string"}',
  '{"success": "boolean", "message": "string"}',
  NULL,
  NULL,
  true
);