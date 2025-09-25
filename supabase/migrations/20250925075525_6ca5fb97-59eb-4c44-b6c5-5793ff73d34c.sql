-- Create a function to resolve JSON paths by item path values instead of array indices
CREATE OR REPLACE FUNCTION app.json_resolve_by_path(
  p_job_id UUID,
  p_address TEXT
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  ltree_path TEXT;
  json_path TEXT;
  node_content JSONB;
  path_parts TEXT[];
  current_content JSONB;
  i INTEGER;
  found_item JSONB;
  items_array JSONB;
BEGIN
  -- Split address into ltree path and json path
  IF p_address ~ '#' THEN
    ltree_path := split_part(p_address, '#', 1);
    json_path := split_part(p_address, '#', 2);
  ELSE
    ltree_path := p_address;
    json_path := NULL;
  END IF;

  -- Get the node content
  SELECT content INTO node_content
  FROM app.nodes
  WHERE job_id = p_job_id AND path = ltree_path::ltree;

  IF node_content IS NULL THEN
    RETURN NULL;
  END IF;

  -- If no json path, return the whole content
  IF json_path IS NULL THEN
    RETURN node_content;
  END IF;

  -- Split the json path into parts
  path_parts := string_to_array(json_path, '.');
  current_content := node_content;

  -- Navigate through each path part
  FOR i IN 1..array_length(path_parts, 1) LOOP
    DECLARE
      current_part TEXT := path_parts[i];
    BEGIN
      -- Check if we're looking for an item by path in an items array
      IF current_content ? 'items' AND jsonb_typeof(current_content->'items') = 'array' THEN
        items_array := current_content->'items';
        found_item := NULL;
        
        -- Search for item with matching path
        FOR j IN 0..jsonb_array_length(items_array)-1 LOOP
          IF (items_array->j) ? 'path' AND (items_array->j)->>'path' = current_part THEN
            found_item := items_array->j;
            EXIT;
          END IF;
        END LOOP;
        
        IF found_item IS NOT NULL THEN
          current_content := found_item;
        ELSE
          RETURN NULL; -- Path not found
        END IF;
        
      -- Check if we're looking for an item by path in a children array  
      ELSIF current_content ? 'children' AND jsonb_typeof(current_content->'children') = 'array' THEN
        items_array := current_content->'children';
        found_item := NULL;
        
        -- Search for item with matching path
        FOR j IN 0..jsonb_array_length(items_array)-1 LOOP
          IF (items_array->j) ? 'path' AND (items_array->j)->>'path' = current_part THEN
            found_item := items_array->j;
            EXIT;
          END IF;
        END LOOP;
        
        IF found_item IS NOT NULL THEN
          current_content := found_item;
        ELSE
          RETURN NULL; -- Path not found
        END IF;
        
      -- Regular property access
      ELSIF current_content ? current_part THEN
        current_content := current_content->current_part;
      ELSE
        RETURN NULL; -- Property not found
      END IF;
    END;
  END LOOP;

  RETURN current_content;
END;
$$;

-- Create a function to set values using path-based addressing
CREATE OR REPLACE FUNCTION app.json_set_by_path(
  p_job_id UUID,
  p_address TEXT,
  p_value JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  ltree_path TEXT;
  json_path TEXT;
  node_content JSONB;
  path_parts TEXT[];
  updated_content JSONB;
  i INTEGER;
  found_item JSONB;
  items_array JSONB;
  target_index INTEGER;
BEGIN
  -- Split address into ltree path and json path
  IF p_address ~ '#' THEN
    ltree_path := split_part(p_address, '#', 1);
    json_path := split_part(p_address, '#', 2);
  ELSE
    RETURN FALSE; -- Cannot set without json path
  END IF;

  -- Get the node content
  SELECT content INTO node_content
  FROM app.nodes
  WHERE job_id = p_job_id AND path = ltree_path::ltree;

  IF node_content IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Split the json path into parts
  path_parts := string_to_array(json_path, '.');
  updated_content := node_content;

  -- Build the jsonb_set path by finding indices for path-based items
  DECLARE
    jsonb_path TEXT[] := '{}';
    current_content JSONB := updated_content;
  BEGIN
    FOR i IN 1..array_length(path_parts, 1) LOOP
      DECLARE
        current_part TEXT := path_parts[i];
      BEGIN
        -- Check if we're looking for an item by path in an items array
        IF current_content ? 'items' AND jsonb_typeof(current_content->'items') = 'array' THEN
          items_array := current_content->'items';
          target_index := NULL;
          
          -- Find the index of the item with matching path
          FOR j IN 0..jsonb_array_length(items_array)-1 LOOP
            IF (items_array->j) ? 'path' AND (items_array->j)->>'path' = current_part THEN
              target_index := j;
              EXIT;
            END IF;
          END LOOP;
          
          IF target_index IS NOT NULL THEN
            jsonb_path := jsonb_path || 'items' || target_index::TEXT;
            current_content := items_array->target_index;
          ELSE
            RETURN FALSE; -- Path not found
          END IF;
          
        -- Check if we're looking for an item by path in a children array
        ELSIF current_content ? 'children' AND jsonb_typeof(current_content->'children') = 'array' THEN
          items_array := current_content->'children';
          target_index := NULL;
          
          -- Find the index of the item with matching path
          FOR j IN 0..jsonb_array_length(items_array)-1 LOOP
            IF (items_array->j) ? 'path' AND (items_array->j)->>'path' = current_part THEN
              target_index := j;
              EXIT;
            END IF;
          END LOOP;
          
          IF target_index IS NOT NULL THEN
            jsonb_path := jsonb_path || 'children' || target_index::TEXT;
            current_content := items_array->target_index;
          ELSE
            RETURN FALSE; -- Path not found
          END IF;
          
        -- Regular property access
        ELSE
          jsonb_path := jsonb_path || current_part;
          IF current_content ? current_part THEN
            current_content := current_content->current_part;
          ELSE
            -- Allow setting new properties
            current_content := '{}'::jsonb;
          END IF;
        END IF;
      END;
    END LOOP;

    -- Update the node with the new content
    UPDATE app.nodes
    SET content = jsonb_set(content, jsonb_path, p_value, true)
    WHERE job_id = p_job_id AND path = ltree_path::ltree;

    RETURN FOUND;
  END;
END;
$$;