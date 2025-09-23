-- Enable RLS on node_library table  
ALTER TABLE app.node_library ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all node library entries
CREATE POLICY "Authenticated users can view node library" 
ON app.node_library FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert node library entries
CREATE POLICY "Authenticated users can create node library entries" 
ON app.node_library FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update node library entries
CREATE POLICY "Authenticated users can update node library entries" 
ON app.node_library FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Allow authenticated users to delete node library entries
CREATE POLICY "Authenticated users can delete node library entries" 
ON app.node_library FOR DELETE 
TO authenticated 
USING (true);

-- Also allow service_role full access for system operations
CREATE POLICY "Service role has full access to node library" 
ON app.node_library FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);