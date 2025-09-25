-- Drop and recreate the json_set_by_path function to handle raw values
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

  -- Get the current content of the node
  SELECT content INTO current_node_content
  FROM app.storyboard_nodes 
  WHERE job_id = p_job_id AND path = ltree_path::ltree;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Node not found at path: %', ltree_path;
  END IF;

  -- Update the content
  IF json_path IS NULL THEN
    -- Replace entire content
    updated_content := p_value;
  ELSE
    -- Update nested path
    updated_content := current_node_content;
    
    -- Handle special segments like 'children' and 'items'
    FOR i IN 1..array_length(json_path, 1) LOOP
      IF i = array_length(json_path, 1) THEN
        -- Last segment - set the value
        IF i = 1 THEN
          updated_content := jsonb_set(updated_content, ARRAY[json_path[i]], p_value, true);
        ELSE
          -- Build the path up to this point
          DECLARE
            current_path text[] := json_path[1:i-1];
            target_obj jsonb;
          BEGIN
            target_obj := updated_content #> current_path;
            
            -- Check if we're in an array and need to find by path/ref/id
            IF jsonb_typeof(target_obj) = 'array' AND i > 1 THEN
              -- Previous segment was 'children' or 'items', find the object with matching path/ref/id
              DECLARE
                arr_element jsonb;
                element_index int := 0;
                found_index int := -1;
              BEGIN
                FOR arr_element IN SELECT * FROM jsonb_array_elements(target_obj) LOOP
                  IF (arr_element ? 'path' AND arr_element->>'path' = json_path[i]) OR
                     (arr_element ? 'ref' AND arr_element->>'ref' = json_path[i]) OR
                     (arr_element ? 'id' AND arr_element->>'id' = json_path[i]) THEN
                    found_index := element_index;
                    EXIT;
                  END IF;
                  element_index := element_index + 1;
                END LOOP;
                
                IF found_index >= 0 THEN
                  updated_content := jsonb_set(
                    updated_content, 
                    current_path || ARRAY[found_index::text], 
                    p_value, 
                    false
                  );
                ELSE
                  RAISE EXCEPTION 'Array element not found with identifier: %', json_path[i];
                END IF;
              END;
            ELSE
              updated_content := jsonb_set(updated_content, json_path[1:i], p_value, true);
            END IF;
          END;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Update the node content
  UPDATE app.storyboard_nodes 
  SET content = updated_content
  WHERE job_id = p_job_id AND path = ltree_path::ltree;
  
  RETURN updated_content;
END;
$$;