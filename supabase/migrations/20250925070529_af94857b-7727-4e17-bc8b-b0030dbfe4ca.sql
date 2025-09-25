-- Fix the ltree comparison issue in get_item_at function
CREATE OR REPLACE FUNCTION app.get_item_at(_job_id uuid, _addr text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  parsed_addr record;
  node_content jsonb;
  result jsonb;
BEGIN
  -- Parse the hybrid address
  SELECT * INTO parsed_addr FROM app.parse_hybrid_addr(_addr);
  
  -- Find the node by job_id and ltree path (convert text to ltree for comparison)
  SELECT content INTO node_content
  FROM app.nodes
  WHERE job_id = _job_id AND path = parsed_addr.ltree_path::ltree;
  
  IF node_content IS NULL THEN
    RAISE EXCEPTION 'Node not found for job % and path %', _job_id, parsed_addr.ltree_path;
  END IF;
  
  -- If no json keys, return the entire content
  IF array_length(parsed_addr.json_keys, 1) IS NULL THEN
    RETURN node_content;
  END IF;
  
  -- Use json_resolve_strict to get the value at the json path
  SELECT public.json_resolve_strict(node_content, parsed_addr.json_keys) INTO result;
  
  RETURN result;
END;
$$;

-- Fix the ltree comparison issue in set_item_at function
CREATE OR REPLACE FUNCTION app.set_item_at(_job_id uuid, _addr text, _value jsonb)
RETURNS app.nodes
LANGUAGE plpgsql
AS $$
DECLARE
  parsed_addr record;
  target_node app.nodes;
  updated_content jsonb;
BEGIN
  -- Parse the hybrid address
  SELECT * INTO parsed_addr FROM app.parse_hybrid_addr(_addr);
  
  -- Find the target node (convert text to ltree for comparison)
  SELECT * INTO target_node
  FROM app.nodes
  WHERE job_id = _job_id AND path = parsed_addr.ltree_path::ltree;
  
  IF target_node IS NULL THEN
    RAISE EXCEPTION 'Node not found for job % and path %', _job_id, parsed_addr.ltree_path;
  END IF;
  
  -- If no json keys, replace the entire content
  IF array_length(parsed_addr.json_keys, 1) IS NULL THEN
    updated_content := _value;
  ELSE
    -- Use jsonb_set to update the specific json path
    updated_content := jsonb_set(
      target_node.content,
      parsed_addr.json_keys,
      _value,
      true
    );
  END IF;
  
  -- Update the node
  UPDATE app.nodes
  SET 
    content = updated_content,
    updated_at = now()
  WHERE id = target_node.id
  RETURNING * INTO target_node;
  
  RETURN target_node;
END;
$$;