-- Drop the existing unique constraint on (job_id, path)
ALTER TABLE app.nodes DROP CONSTRAINT IF EXISTS nodes_job_id_path_key;

-- Add a new unique constraint on (job_id, addr)
-- This ensures each node has a unique full ltree address within a job
ALTER TABLE app.nodes ADD CONSTRAINT nodes_job_id_addr_key UNIQUE (job_id, addr);