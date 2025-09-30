-- Drop old individual min_shape constraints that use outdated validation functions
ALTER TABLE app.nodes DROP CONSTRAINT IF EXISTS chk_nodes_form_min_shape;
ALTER TABLE app.nodes DROP CONSTRAINT IF EXISTS chk_nodes_group_min_shape;
ALTER TABLE app.nodes DROP CONSTRAINT IF EXISTS chk_nodes_media_min_shape;

-- Replace the main content validation constraint with SSOT-based validation
ALTER TABLE app.nodes DROP CONSTRAINT IF EXISTS chk_nodes_content_shape;
ALTER TABLE app.nodes ADD CONSTRAINT chk_nodes_content_shape 
  CHECK (app.is_valid_content_shape(node_type::text, content));