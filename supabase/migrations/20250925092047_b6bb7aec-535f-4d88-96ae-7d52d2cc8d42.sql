-- Update json_set_by_path to handle raw values without automatic jsonb encoding

CREATE OR REPLACE FUNCTION app.json_set_by_path(p_job_id uuid, p_address text, p_value text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  ltree_path TEXT;
  json_path TEXT;
  node_content JSONB;
  path_parts TEXT[];
  updated_content JSONB;
  target_value JSONB;
BEGIN
  -- Parse hybrid address
  IF p_address ~ '#' THEN
    ltree_path := split_part(p_address, '#', 1);
    json_path := split_part(p_address, '#', 2);
  ELSE
    RETURN FALSE;
  END IF;

  -- Get current node content
  SELECT content INTO node_content
  FROM app.nodes
  WHERE job_id = p_job_id AND path::text = ltree_path;

  IF node_content IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Convert the text value to appropriate jsonb
  -- Try to parse as JSON first, if it fails treat as raw string
  BEGIN
    target_value := p_value::jsonb;
  EXCEPTION WHEN OTHERS THEN
    -- If JSON parsing fails, treat as a raw string
    target_value := to_jsonb(p_value);
  END;

  -- Build JSONB path for jsonb_set
  path_parts := string_to_array(json_path, '.');
  
  -- Use recursive helper function to build the correct path
  updated_content := app.json_set_recursive(node_content, path_parts, 1, target_value);
  
  -- Update the node
  UPDATE app.nodes
  SET 
    content = updated_content,
    updated_at = now()
  WHERE job_id = p_job_id AND path::text = ltree_path;

  RETURN TRUE;
END;
$function$;