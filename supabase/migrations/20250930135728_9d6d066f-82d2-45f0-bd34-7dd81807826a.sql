-- Drop the overloaded function with uuid session_id to resolve ambiguity
-- We keep the version with text session_id since guest sessions use text IDs
DROP FUNCTION IF EXISTS app.instantiate_template(p_template_id text, p_user_id uuid, p_session_id uuid);