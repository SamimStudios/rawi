-- Fix ltree functions to work with app.nodes instead of app.storyboard_nodes

-- Drop and recreate the json_resolve_by_path function to use app.nodes
DROP FUNCTION IF EXISTS app.json_resolve_by_path(uuid, text);

CREATE OR REPLACE FUNCTION app.json_resolve_by_path(
  p_job_id uuid,
  p_address text
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  parts text[];
  ltree_path text;
  json_path text[];
  node_content jsonb;
  result jsonb;
BEGIN
  -- Parse the hybrid address
  IF position('#' in p_address) > 0 THEN
    parts := string_to_array(p_address, '#');
    ltree_path := parts[1];
    json_path := string_to_array(parts[2], '.');
  ELSE
    ltree_path := p_address;
    json_path := NULL;
  END IF;

  -- Get the node content using path_ltree for better performance
  SELECT content INTO node_content
  FROM app.nodes 
  WHERE job_id = p_job_id AND path_ltree = ltree_path::ltree;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Node not found at path: %', ltree_path;
  END IF;

  -- Return the content or navigate to the JSON path
  IF json_path IS NULL THEN
    result := node_content;
  ELSE
    result := node_content #> json_path;
  END IF;

  RETURN result;
END;
$$;

-- Drop and recreate the json_set_by_path function to use app.nodes
DROP FUNCTION IF EXISTS app.json_set_by_path(uuid, text, text);
DROP FUNCTION IF EXISTS app.json_set_by_path(uuid, text, jsonb);

CREATE OR REPLACE FUNCTION app.json_set_by_path(
  p_job_id uuid,
  p_address text,
  p_value jsonb
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  parts text[];
  ltree_path text;
  json_path text[];
  current_node_content jsonb;
  updated_content jsonb;
BEGIN
  -- Parse the hybrid address
  IF position('#' in p_address) > 0 THEN
    parts := string_to_array(p_address, '#');
    ltree_path := parts[1];
    json_path := string_to_array(parts[2], '.');
  ELSE
    ltree_path := p_address;
    json_path := NULL;
  END IF;

  -- Get the current content of the node using path_ltree for better performance
  SELECT content INTO current_node_content
  FROM app.nodes 
  WHERE job_id = p_job_id AND path_ltree = ltree_path::ltree;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Node not found at path: %', ltree_path;
  END IF;

  -- Update the content
  IF json_path IS NULL THEN
    -- Replace entire content
    updated_content := p_value;
  ELSE
    -- Update nested path using jsonb_set
    updated_content := jsonb_set(current_node_content, json_path, p_value, true);
  END IF;

  -- Update the node content using path_ltree
  UPDATE app.nodes 
  SET content = updated_content
  WHERE job_id = p_job_id AND path_ltree = ltree_path::ltree;
  
  RETURN updated_content;
END;
$$;