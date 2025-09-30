-- Enable RLS on app.templates and app.template_nodes
ALTER TABLE app.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.template_nodes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all templates
CREATE POLICY "Authenticated users can view templates"
ON app.templates
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to insert templates
CREATE POLICY "Authenticated users can create templates"
ON app.templates
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to update templates
CREATE POLICY "Authenticated users can update templates"
ON app.templates
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to read template_nodes
CREATE POLICY "Authenticated users can view template nodes"
ON app.template_nodes
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to insert template_nodes
CREATE POLICY "Authenticated users can create template nodes"
ON app.template_nodes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to update template_nodes
CREATE POLICY "Authenticated users can update template nodes"
ON app.template_nodes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to delete template_nodes
CREATE POLICY "Authenticated users can delete template nodes"
ON app.template_nodes
FOR DELETE
TO authenticated
USING (true);