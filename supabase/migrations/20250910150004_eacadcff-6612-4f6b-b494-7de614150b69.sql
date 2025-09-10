-- Update generate-movie-info function with proper schemas
UPDATE n8n_functions 
SET 
  expected_schema = '{
    "type": "object",
    "title": "RowReference",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "required": ["table_id", "row_id"],
    "properties": {
      "row_id": {
        "type": "string",
        "format": "uuid",
        "description": "Unique identifier of the row"
      },
      "table_id": {
        "type": "string",
        "description": "Name of the table"
      }
    },
    "additionalProperties": false
  }'::jsonb,
  success_response_schema = '{
    "type": "object",
    "title": "MovieInfoResponse",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "required": ["movie_info"],
    "properties": {
      "movie_info": {
        "type": "object",
        "required": ["title", "logline", "world", "look"],
        "properties": {
          "title": {
            "type": "string",
            "description": "Movie title"
          },
          "logline": {
            "type": "string", 
            "description": "Movie logline/premise"
          },
          "world": {
            "type": "string",
            "description": "Movie world/setting description"
          },
          "look": {
            "type": "string",
            "description": "Visual style/look description"
          }
        },
        "additionalProperties": false
      }
    },
    "additionalProperties": false
  }'::jsonb,
  updated_at = now()
WHERE name = 'generate-movie-info';

-- Update validate-movie-info function with proper schemas  
UPDATE n8n_functions
SET
  expected_schema = '{
    "type": "object",
    "title": "MovieInfoValidationRequest",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "required": ["movie_info"],
    "properties": {
      "movie_info": {
        "type": "object",
        "required": ["title", "logline", "world", "look"],
        "properties": {
          "title": {
            "type": "string",
            "description": "Movie title to validate"
          },
          "logline": {
            "type": "string",
            "description": "Movie logline to validate"
          },
          "world": {
            "type": "string", 
            "description": "Movie world/setting to validate"
          },
          "look": {
            "type": "string",
            "description": "Visual style/look to validate"
          }
        },
        "additionalProperties": false
      }
    },
    "additionalProperties": false
  }'::jsonb,
  success_response_schema = '{
    "type": "object",
    "title": "ValidationResponse",
    "$schema": "https://json-schema.org/draft/2020-12/schema", 
    "required": ["valid"],
    "properties": {
      "valid": {
        "type": "boolean",
        "description": "Whether the movie info is valid"
      },
      "reason": {
        "type": "object",
        "properties": {
          "en": {
            "type": "string",
            "description": "Validation failure reason in English"
          },
          "ar": {
            "type": "string", 
            "description": "Validation failure reason in Arabic"
          }
        },
        "additionalProperties": false
      },
      "suggested_fix": {
        "type": "object",
        "properties": {
          "movie_title": {
            "type": "string",
            "description": "Suggested movie title fix"
          },
          "logline": {
            "type": "string",
            "description": "Suggested logline fix"
          },
          "world": {
            "type": "string",
            "description": "Suggested world fix"
          },
          "look": {
            "type": "string",
            "description": "Suggested look fix"
          }
        },
        "additionalProperties": false
      }
    },
    "additionalProperties": false
  }'::jsonb,
  updated_at = now()
WHERE name = 'validate-movie-info';