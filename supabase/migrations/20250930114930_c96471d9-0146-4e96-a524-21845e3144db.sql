-- Fix RLS policies for app.jobs to ensure user_id consistency

-- Drop and recreate INSERT policy with proper WITH CHECK
DROP POLICY IF EXISTS jobs_insert_auth ON app.jobs;
CREATE POLICY "jobs_insert_auth" ON app.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Also ensure nodes INSERT policy is consistent  
DROP POLICY IF EXISTS nodes_insert_auth ON app.nodes;
CREATE POLICY "nodes_insert_auth" ON app.nodes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    job_id IN (
      SELECT id FROM app.jobs WHERE user_id = auth.uid()
    )
  );