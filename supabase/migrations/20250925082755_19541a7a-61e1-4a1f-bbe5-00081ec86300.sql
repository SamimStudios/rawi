-- Fix json_resolve_by_path to properly handle direct JSON property access
CREATE OR REPLACE FUNCTION app.json_resolve_by_path(p_job_id uuid, p_address text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
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
  -- Parse hybrid address
  IF p_address ~ '#' THEN
    ltree_path := split_part(p_address, '#', 1);
    json_path := split_part(p_address, '#', 2);
  ELSE
    ltree_path := p_address;
    json_path := NULL;
  END IF;

  -- Get node content
  SELECT content INTO node_content
  FROM app.nodes
  WHERE job_id = p_job_id AND path::text = ltree_path;

  IF node_content IS NULL THEN
    RETURN NULL;
  END IF;

  -- If no JSON path, return entire node content
  IF json_path IS NULL THEN
    RETURN node_content;
  END IF;

  -- Navigate JSON path
  path_parts := string_to_array(json_path, '.');
  current_content := node_content;

  FOR i IN 1..array_length(path_parts, 1) LOOP
    DECLARE 
      current_part TEXT := path_parts[i];
      is_last_part BOOLEAN := (i = array_length(path_parts, 1));
    BEGIN
      -- Try structured navigation first (for items/children with path properties)
      IF current_content ? 'items' AND jsonb_typeof(current_content->'items') = 'array' THEN
        items_array := current_content->'items';
        found_item := NULL;
        
        FOR j IN 0..jsonb_array_length(items_array)-1 LOOP
          IF (items_array->j) ? 'path' AND (items_array->j)->>'path' = current_part THEN
            found_item := items_array->j;
            EXIT;
          END IF;
        END LOOP;
        
        IF found_item IS NOT NULL THEN
          current_content := found_item;
          CONTINUE;
        END IF;
      END IF;

      IF current_content ? 'children' AND jsonb_typeof(current_content->'children') = 'array' THEN
        items_array := current_content->'children';
        found_item := NULL;
        
        FOR j IN 0..jsonb_array_length(items_array)-1 LOOP
          IF (items_array->j) ? 'path' AND (items_array->j)->>'path' = current_part THEN
            found_item := items_array->j;
            EXIT;
          END IF;
        END LOOP;
        
        IF found_item IS NOT NULL THEN
          current_content := found_item;
          CONTINUE;
        END IF;
      END IF;

      -- Direct JSON property access
      IF current_content ? current_part THEN
        current_content := current_content->current_part;
      ELSE
        RETURN NULL;
      END IF;
    END;
  END LOOP;

  RETURN current_content;
END;
$function$;

-- Fix json_set_by_path to properly handle direct JSON property access
CREATE OR REPLACE FUNCTION app.json_set_by_path(p_job_id uuid, p_address text, p_value jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  ltree_path TEXT;
  json_path TEXT;
  node_content JSONB;
  path_parts TEXT[];
  updated_content JSONB;
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

  -- Build JSONB path for jsonb_set
  path_parts := string_to_array(json_path, '.');
  
  -- Use recursive helper function to build the correct path
  updated_content := app.json_set_recursive(node_content, path_parts, 1, p_value);
  
  -- Update the node
  UPDATE app.nodes
  SET 
    content = updated_content,
    updated_at = now()
  WHERE job_id = p_job_id AND path::text = ltree_path;

  RETURN TRUE;
END;
$function$;

-- Helper function for recursive JSON path setting
CREATE OR REPLACE FUNCTION app.json_set_recursive(
  current_content JSONB,
  path_parts TEXT[],
  current_index INTEGER,
  target_value JSONB
) RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
  current_part TEXT;
  is_last_part BOOLEAN;
  items_array JSONB;
  found_index INTEGER;
  updated_items JSONB;
  updated_item JSONB;
BEGIN
  IF current_index > array_length(path_parts, 1) THEN
    RETURN target_value;
  END IF;

  current_part := path_parts[current_index];
  is_last_part := (current_index = array_length(path_parts, 1));

  -- Handle structured content (items array)
  IF current_content ? 'items' AND jsonb_typeof(current_content->'items') = 'array' THEN
    items_array := current_content->'items';
    found_index := NULL;
    
    FOR j IN 0..jsonb_array_length(items_array)-1 LOOP
      IF (items_array->j) ? 'path' AND (items_array->j)->>'path' = current_part THEN
        found_index := j;
        EXIT;
      END IF;
    END LOOP;
    
    IF found_index IS NOT NULL THEN
      IF is_last_part THEN
        updated_items := jsonb_set(items_array, ARRAY[found_index::text], target_value);
      ELSE
        updated_item := app.json_set_recursive(
          items_array->found_index,
          path_parts,
          current_index + 1,
          target_value
        );
        updated_items := jsonb_set(items_array, ARRAY[found_index::text], updated_item);
      END IF;
      
      RETURN jsonb_set(current_content, '{items}', updated_items);
    END IF;
  END IF;

  -- Handle structured content (children array)
  IF current_content ? 'children' AND jsonb_typeof(current_content->'children') = 'array' THEN
    items_array := current_content->'children';
    found_index := NULL;
    
    FOR j IN 0..jsonb_array_length(items_array)-1 LOOP
      IF (items_array->j) ? 'path' AND (items_array->j)->>'path' = current_part THEN
        found_index := j;
        EXIT;
      END IF;
    END LOOP;
    
    IF found_index IS NOT NULL THEN
      IF is_last_part THEN
        updated_items := jsonb_set(items_array, ARRAY[found_index::text], target_value);
      ELSE
        updated_item := app.json_set_recursive(
          items_array->found_index,
          path_parts,
          current_index + 1,
          target_value
        );
        updated_items := jsonb_set(items_array, ARRAY[found_index::text], updated_item);
      END IF;
      
      RETURN jsonb_set(current_content, '{children}', updated_items);
    END IF;
  END IF;

  -- Handle direct JSON properties
  IF is_last_part THEN
    RETURN jsonb_set(current_content, ARRAY[current_part], target_value);
  ELSE
    -- Navigate deeper or create path if it doesn't exist
    IF current_content ? current_part THEN
      RETURN jsonb_set(
        current_content,
        ARRAY[current_part],
        app.json_set_recursive(
          current_content->current_part,
          path_parts,
          current_index + 1,
          target_value
        )
      );
    ELSE
      -- Create the path if it doesn't exist
      RETURN jsonb_set(
        current_content,
        ARRAY[current_part],
        app.json_set_recursive(
          '{}'::jsonb,
          path_parts,
          current_index + 1,
          target_value
        )
      );
    END IF;
  END IF;
END;
$function$;