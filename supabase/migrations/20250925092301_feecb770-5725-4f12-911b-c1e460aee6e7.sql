-- Drop the old version of json_set_by_path that takes jsonb parameter
-- This resolves the function overloading conflict
DROP FUNCTION IF EXISTS app.json_set_by_path(uuid, text, jsonb);