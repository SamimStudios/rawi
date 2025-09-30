-- Drop existing functions to recreate with correct signatures
DROP FUNCTION IF EXISTS app.instantiate_template(uuid, uuid, text);
DROP FUNCTION IF EXISTS app.materialize_group_children(uuid, text, jsonb);

-- Create improved instantiate_template function
CREATE OR REPLACE FUNCTION app.instantiate_template(
  p_template_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app, public
AS $$
DECLARE
  v_template_row RECORD;
  v_job_id uuid;
  v_node RECORD;
  v_content jsonb;
BEGIN
  -- 1) Fetch active template
  SELECT id, name, category, current_version
  INTO v_template_row
  FROM app.templates
  WHERE id = p_template_id AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template % not found or inactive', p_template_id;
  END IF;

  -- 2) Create job
  INSERT INTO app.jobs (template_id, user_id, session_id, job_name, category)
  VALUES (p_template_id, p_user_id, p_session_id, v_template_row.name, v_template_row.category)
  RETURNING id INTO v_job_id;

  -- 3) Copy template nodes (top-level only - recursion will handle children)
  FOR v_node IN
    SELECT tn.path, tn.node_type, tn.library_id, tn.content
    FROM app.template_nodes tn
    WHERE tn.template_id = p_template_id
      AND tn.version = v_template_row.current_version
      AND tn.parent_addr IS NULL  -- Only root nodes
    ORDER BY tn.idx
  LOOP
    -- Insert node
    INSERT INTO app.nodes (job_id, path, node_type, library_id, content)
    VALUES (v_job_id, v_node.path::ltree, v_node.node_type, v_node.library_id, v_node.content)
    ON CONFLICT (job_id, path) DO NOTHING;

    -- If group, recursively materialize children
    IF lower(v_node.node_type::text) = 'group' THEN
      v_content := v_node.content;
      
      -- Check for regular children (array of library node IDs)
      IF v_content ? 'children' AND jsonb_typeof(v_content->'children') = 'array' THEN
        PERFORM app.materialize_group_children(v_job_id, v_node.path::text, v_content->'children');
      END IF;

      -- Check for collection with default_instances
      IF v_content ? 'collection' AND v_content->'collection' ? 'default_instances' THEN
        PERFORM app.materialize_collection_instances(
          v_job_id, 
          v_node.path::text, 
          v_content->'collection'
        );
      END IF;
    END IF;
  END LOOP;

  RETURN v_job_id;
END;
$$;

-- Helper: materialize children (array of library node IDs)
CREATE OR REPLACE FUNCTION app.materialize_group_children(
  p_job_id uuid,
  p_parent_path text,
  p_children jsonb  -- array of library node IDs or node_link objects
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app, public
AS $$
DECLARE
  v_child jsonb;
  v_child_lib_id uuid;
  v_child_label text;
  v_child_path text;
  v_lib_node RECORD;
  v_content jsonb;
BEGIN
  -- Iterate through children array
  FOR v_child IN SELECT * FROM jsonb_array_elements(p_children)
  LOOP
    -- Extract library_id (handle both string and node_link object)
    IF jsonb_typeof(v_child) = 'string' THEN
      v_child_lib_id := (v_child #>> '{}')::uuid;
      v_child_label := NULL;  -- Will derive from library node
    ELSIF jsonb_typeof(v_child) = 'object' AND v_child ? 'path' THEN
      v_child_label := v_child->>'path';
      v_child_lib_id := (v_child->>'library_id')::uuid;
    ELSE
      CONTINUE;  -- Skip invalid entries
    END IF;

    -- Fetch from node_library
    SELECT id, node_type, content
    INTO v_lib_node
    FROM app.node_library
    WHERE id = v_child_lib_id AND active = true;

    IF NOT FOUND THEN
      RAISE WARNING 'Library node % not found or inactive', v_child_lib_id;
      CONTINUE;
    END IF;

    -- Derive label if not provided
    IF v_child_label IS NULL THEN
      v_child_label := v_lib_node.content->>'path';
      IF v_child_label IS NULL THEN
        RAISE WARNING 'No path label for library node %', v_child_lib_id;
        CONTINUE;
      END IF;
    END IF;

    -- Build child path using ltree
    v_child_path := (p_parent_path::ltree || v_child_label::ltree)::text;

    -- Insert child node
    INSERT INTO app.nodes (job_id, path, node_type, library_id, content)
    VALUES (p_job_id, v_child_path::ltree, v_lib_node.node_type, v_child_lib_id, v_lib_node.content)
    ON CONFLICT (job_id, path) DO NOTHING;

    -- Recurse if child is also a group
    IF lower(v_lib_node.node_type::text) = 'group' THEN
      v_content := v_lib_node.content;
      
      IF v_content ? 'children' AND jsonb_typeof(v_content->'children') = 'array' THEN
        PERFORM app.materialize_group_children(p_job_id, v_child_path, v_content->'children');
      END IF;

      IF v_content ? 'collection' AND v_content->'collection' ? 'default_instances' THEN
        PERFORM app.materialize_collection_instances(p_job_id, v_child_path, v_content->'collection');
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Helper: materialize collection instances
CREATE OR REPLACE FUNCTION app.materialize_collection_instances(
  p_job_id uuid,
  p_parent_path text,
  p_collection jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app, public
AS $$
DECLARE
  v_default_instances int;
  v_children jsonb;
  v_instance_num int;
  v_instance_path text;
  v_anchor_lib_id uuid;
BEGIN
  -- Get default_instances count
  v_default_instances := COALESCE((p_collection->>'default_instances')::int, 0);
  v_children := p_collection->'children';

  IF v_default_instances <= 0 OR v_children IS NULL THEN
    RETURN;
  END IF;

  -- Create instances anchor group
  v_instance_path := (p_parent_path::ltree || 'instances'::ltree)::text;
  v_anchor_lib_id := 'lib_group_instances_anchor'::uuid;  -- Predefined anchor

  INSERT INTO app.nodes (job_id, path, node_type, library_id, content)
  VALUES (p_job_id, v_instance_path::ltree, 'group', v_anchor_lib_id, '{"kind":"Group"}'::jsonb)
  ON CONFLICT (job_id, path) DO NOTHING;

  -- Create each instance
  FOR v_instance_num IN 1..v_default_instances
  LOOP
    v_instance_path := (p_parent_path::ltree || ('instances.i' || v_instance_num)::ltree)::text;
    
    -- Insert instance anchor
    INSERT INTO app.nodes (job_id, path, node_type, library_id, content)
    VALUES (p_job_id, v_instance_path::ltree, 'group', 'lib_group_instance_anchor'::uuid, '{"kind":"Group"}'::jsonb)
    ON CONFLICT (job_id, path) DO NOTHING;

    -- Materialize instance children
    PERFORM app.materialize_group_children(p_job_id, v_instance_path, v_children);
  END LOOP;
END;
$$;

-- Ensure unique constraint on (job_id, path)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'nodes_job_id_path_key' 
    AND conrelid = 'app.nodes'::regclass
  ) THEN
    ALTER TABLE app.nodes ADD CONSTRAINT nodes_job_id_path_key UNIQUE (job_id, path);
  END IF;
END $$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION app.instantiate_template(uuid, uuid, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION app.materialize_group_children(uuid, text, jsonb) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION app.materialize_collection_instances(uuid, text, jsonb) TO authenticated, anon;