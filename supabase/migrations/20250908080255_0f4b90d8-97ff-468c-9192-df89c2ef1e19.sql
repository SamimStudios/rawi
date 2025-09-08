-- Allow guest access to jobs by modifying RLS policies
-- This enables users to start jobs before registering and access them during the process

-- Update jobs table policies to allow guest access
DROP POLICY IF EXISTS "Users can view their own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can create their own jobs" ON jobs;

-- New policy: Users can view their own jobs OR jobs without user_id (guest jobs)
CREATE POLICY "Users can view their own jobs or guest jobs"
ON jobs FOR SELECT
USING (
  auth.uid() = user_id OR 
  user_id IS NULL
);

-- New policy: Users can update their own jobs OR guest jobs (for completion/registration)
CREATE POLICY "Users can update their own jobs or guest jobs"
ON jobs FOR UPDATE
USING (
  auth.uid() = user_id OR 
  user_id IS NULL
)
WITH CHECK (
  auth.uid() = user_id OR 
  user_id IS NULL
);

-- New policy: Allow creating jobs for authenticated users or guest jobs
CREATE POLICY "Users can create their own jobs or guest jobs"
ON jobs FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  user_id IS NULL
);

-- Update related tables (cards, character_gen, shot_gen) to allow guest access
-- Cards table
DROP POLICY IF EXISTS "Users can view their own cards" ON cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON cards;
DROP POLICY IF EXISTS "Users can create cards for their jobs" ON cards;

CREATE POLICY "Users can view cards for their jobs or guest jobs"
ON cards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = cards.job_id
    AND (jobs.user_id = auth.uid() OR jobs.user_id IS NULL)
  )
);

CREATE POLICY "Users can update cards for their jobs or guest jobs"
ON cards FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = cards.job_id
    AND (jobs.user_id = auth.uid() OR jobs.user_id IS NULL)
  )
);

CREATE POLICY "Users can create cards for their jobs or guest jobs"
ON cards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = cards.job_id
    AND (jobs.user_id = auth.uid() OR jobs.user_id IS NULL)
  )
);

-- Character gen table
DROP POLICY IF EXISTS "Users can view their own character gen data" ON character_gen;
DROP POLICY IF EXISTS "Users can update their own character gen data" ON character_gen;
DROP POLICY IF EXISTS "Users can create character gen data for their jobs" ON character_gen;

CREATE POLICY "Users can view character gen data for their jobs or guest jobs"
ON character_gen FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = character_gen.job_id
    AND (jobs.user_id = auth.uid() OR jobs.user_id IS NULL)
  )
);

CREATE POLICY "Users can update character gen data for their jobs or guest jobs"
ON character_gen FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = character_gen.job_id
    AND (jobs.user_id = auth.uid() OR jobs.user_id IS NULL)
  )
);

CREATE POLICY "Users can create character gen data for their jobs or guest jobs"
ON character_gen FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = character_gen.job_id
    AND (jobs.user_id = auth.uid() OR jobs.user_id IS NULL)
  )
);

-- Shot gen table
DROP POLICY IF EXISTS "Users can view their own shot gen data" ON shot_gen;
DROP POLICY IF EXISTS "Users can update their own shot gen data" ON shot_gen;
DROP POLICY IF EXISTS "Users can create shot gen data for their jobs" ON shot_gen;

CREATE POLICY "Users can view shot gen data for their jobs or guest jobs"
ON shot_gen FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = shot_gen.job_id
    AND (jobs.user_id = auth.uid() OR jobs.user_id IS NULL)
  )
);

CREATE POLICY "Users can update shot gen data for their jobs or guest jobs"
ON shot_gen FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = shot_gen.job_id
    AND (jobs.user_id = auth.uid() OR jobs.user_id IS NULL)
  )
);

CREATE POLICY "Users can create shot gen data for their jobs or guest jobs"
ON shot_gen FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = shot_gen.job_id
    AND (jobs.user_id = auth.uid() OR jobs.user_id IS NULL)
  )
);

-- Add function to link guest jobs to user upon registration
CREATE OR REPLACE FUNCTION public.link_guest_jobs_to_user(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update guest jobs with this email to the authenticated user
  UPDATE jobs 
  SET user_id = auth.uid(), updated_at = now()
  WHERE email = p_email AND user_id IS NULL;
END;
$$;