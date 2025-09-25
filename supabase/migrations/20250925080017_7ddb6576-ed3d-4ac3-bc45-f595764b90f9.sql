-- Patch: fix text vs ltree comparison by comparing as text
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
  IF p_address ~ '#' THEN
    ltree_path := split_part(p_address, '#', 1);
    json_path := split_part(p_address, '#', 2);
  ELSE
    ltree_path := p_address;
    json_path := NULL;
  END IF;

  SELECT content INTO node_content
  FROM app.nodes
  WHERE job_id = p_job_id AND path::text = ltree_path;  -- changed

  IF node_content IS NULL THEN
    RETURN NULL;
  END IF;

  IF json_path IS NULL THEN
    RETURN node_content;
  END IF;

  path_parts := string_to_array(json_path, '.');
  current_content := node_content;

  FOR i IN 1..array_length(path_parts, 1) LOOP
    DECLARE current_part TEXT := path_parts[i]; BEGIN
      IF current_content ? 'items' AND jsonb_typeof(current_content->'items') = 'array' THEN
        items_array := current_content->'items';
        found_item := NULL;
        FOR j IN 0..jsonb_array_length(items_array)-1 LOOP
          IF (items_array->j) ? 'path' AND (items_array->j)->>'path' = current_part THEN
            found_item := items_array->j; EXIT;
          END IF;
        END LOOP;
        IF found_item IS NOT NULL THEN current_content := found_item; ELSE RETURN NULL; END IF;
      ELSIF current_content ? 'children' AND jsonb_typeof(current_content->'children') = 'array' THEN
        items_array := current_content->'children';
        found_item := NULL;
        FOR j IN 0..jsonb_array_length(items_array)-1 LOOP
          IF (items_array->j) ? 'path' AND (items_array->j)->>'path' = current_part THEN
            found_item := items_array->j; EXIT; END IF; END LOOP;
        IF found_item IS NOT NULL THEN current_content := found_item; ELSE RETURN NULL; END IF;
      ELSIF current_content ? current_part THEN
        current_content := current_content->current_part;
      ELSE
        RETURN NULL;
      END IF;
    END; END LOOP;

  RETURN current_content;
END;
$$;

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
  IF p_address ~ '#' THEN
    ltree_path := split_part(p_address, '#', 1);
    json_path := split_part(p_address, '#', 2);
  ELSE
    RETURN FALSE;
  END IF;

  SELECT content INTO node_content
  FROM app.nodes
  WHERE job_id = p_job_id AND path::text = ltree_path;  -- changed

  IF node_content IS NULL THEN RETURN FALSE; END IF;

  path_parts := string_to_array(json_path, '.');
  updated_content := node_content;

  DECLARE jsonb_path TEXT[] := '{}'; current_content JSONB := updated_content; BEGIN
    FOR i IN 1..array_length(path_parts, 1) LOOP
      DECLARE current_part TEXT := path_parts[i]; BEGIN
        IF current_content ? 'items' AND jsonb_typeof(current_content->'items') = 'array' THEN
          items_array := current_content->'items'; target_index := NULL;
          FOR j IN 0..jsonb_array_length(items_array)-1 LOOP
            IF (items_array->j) ? 'path' AND (items_array->j)->>'path' = current_part THEN target_index := j; EXIT; END IF; END LOOP;
          IF target_index IS NOT NULL THEN jsonb_path := jsonb_path || 'items' || target_index::TEXT; current_content := items_array->target_index; ELSE RETURN FALSE; END IF;
        ELSIF current_content ? 'children' AND jsonb_typeof(current_content->'children') = 'array' THEN
          items_array := current_content->'children'; target_index := NULL;
          FOR j IN 0..jsonb_array_length(items_array)-1 LOOP
            IF (items_array->j) ? 'path' AND (items_array->j)->>'path' = current_part THEN target_index := j; EXIT; END IF; END LOOP;
          IF target_index IS NOT NULL THEN jsonb_path := jsonb_path || 'children' || target_index::TEXT; current_content := items_array->target_index; ELSE RETURN FALSE; END IF;
        ELSE
          jsonb_path := jsonb_path || current_part;
          IF current_content ? current_part THEN current_content := current_content->current_part; ELSE current_content := '{}'::jsonb; END IF;
        END IF;
      END; END LOOP;

    UPDATE app.nodes SET content = jsonb_set(content, jsonb_path, p_value, true)
    WHERE job_id = p_job_id AND path::text = ltree_path;  -- changed

    RETURN FOUND;
  END;
END;
$$;