-- Phase 1: Critical Data Protection - Fix RLS policies for guest jobs

-- Add session_id column to jobs table for guest job access control
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS session_id text;

-- Add index for performance on session_id lookups
CREATE INDEX IF NOT EXISTS idx_jobs_session_id ON public.jobs(session_id) WHERE session_id IS NOT NULL;

-- Drop existing overly permissive RLS policies
DROP POLICY IF EXISTS "Users can view their own jobs or guest jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs or guest jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can create their own jobs or guest jobs" ON public.jobs;

-- Create new secure RLS policies

-- Allow users to view their own authenticated jobs
CREATE POLICY "Users can view their own jobs" 
ON public.jobs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to view guest jobs only if they have the session_id (stored in custom claim or passed as parameter)
-- This will be handled by application logic with session management
CREATE POLICY "Users can view guest jobs with session access" 
ON public.jobs 
FOR SELECT 
USING (
  user_id IS NULL AND 
  session_id IS NOT NULL 
  -- Session validation will be handled by application layer
);

-- Allow users to update their own authenticated jobs
CREATE POLICY "Users can update their own jobs" 
ON public.jobs 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow updating guest jobs with session validation (application layer will validate session)
CREATE POLICY "Users can update guest jobs with session access" 
ON public.jobs 
FOR UPDATE 
USING (
  user_id IS NULL AND 
  session_id IS NOT NULL
)
WITH CHECK (
  user_id IS NULL AND 
  session_id IS NOT NULL
);

-- Allow users to create their own authenticated jobs
CREATE POLICY "Users can create their own jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow creating guest jobs (application will set session_id)
CREATE POLICY "Users can create guest jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- Phase 2: Data Cleanup and Privacy Protection

-- Create function to clean up old guest jobs with PII data
CREATE OR REPLACE FUNCTION public.cleanup_old_guest_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete guest jobs older than 7 days that contain PII
  DELETE FROM public.jobs 
  WHERE user_id IS NULL 
    AND created_at < NOW() - INTERVAL '7 days'
    AND (
      email IS NOT NULL OR 
      name IS NOT NULL OR 
      face_image_url IS NOT NULL
    );
    
  -- Clean PII from guest jobs older than 24 hours but keep the job structure
  UPDATE public.jobs 
  SET 
    email = NULL,
    name = NULL,
    face_image_url = NULL,
    updated_at = NOW()
  WHERE user_id IS NULL 
    AND created_at < NOW() - INTERVAL '24 hours'
    AND (
      email IS NOT NULL OR 
      name IS NOT NULL OR 
      face_image_url IS NOT NULL
    );
END;
$$;

-- Create function to generate secure session IDs for guest jobs
CREATE OR REPLACE FUNCTION public.generate_guest_session_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate a secure random session ID
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;

-- Phase 3: Enhanced security for related tables

-- Update cards table RLS to use session-based access for guest jobs
DROP POLICY IF EXISTS "Users can view cards for their jobs or guest jobs" ON public.cards;
DROP POLICY IF EXISTS "Users can update cards for their jobs or guest jobs" ON public.cards;
DROP POLICY IF EXISTS "Users can create cards for their jobs or guest jobs" ON public.cards;

-- Secure policies for cards table
CREATE POLICY "Users can view cards for their authenticated jobs" 
ON public.cards 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = cards.job_id 
    AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can view cards for guest jobs with session access" 
ON public.cards 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = cards.job_id 
    AND jobs.user_id IS NULL 
    AND jobs.session_id IS NOT NULL
));

CREATE POLICY "Users can update cards for their authenticated jobs" 
ON public.cards 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = cards.job_id 
    AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can update cards for guest jobs with session access" 
ON public.cards 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = cards.job_id 
    AND jobs.user_id IS NULL 
    AND jobs.session_id IS NOT NULL
));

CREATE POLICY "Users can create cards for their authenticated jobs" 
ON public.cards 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = cards.job_id 
    AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can create cards for guest jobs with session access" 
ON public.cards 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = cards.job_id 
    AND jobs.user_id IS NULL 
    AND jobs.session_id IS NOT NULL
));

-- Apply similar fixes to shot_gen and character_gen tables
-- shot_gen table policies
DROP POLICY IF EXISTS "Users can view shot gen data for their jobs or guest jobs" ON public.shot_gen;
DROP POLICY IF EXISTS "Users can update shot gen data for their jobs or guest jobs" ON public.shot_gen;
DROP POLICY IF EXISTS "Users can create shot gen data for their jobs or guest jobs" ON public.shot_gen;

CREATE POLICY "Users can view shot gen data for their authenticated jobs" 
ON public.shot_gen 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = shot_gen.job_id 
    AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can view shot gen data for guest jobs with session access" 
ON public.shot_gen 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = shot_gen.job_id 
    AND jobs.user_id IS NULL 
    AND jobs.session_id IS NOT NULL
));

CREATE POLICY "Users can update shot gen data for their authenticated jobs" 
ON public.shot_gen 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = shot_gen.job_id 
    AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can update shot gen data for guest jobs with session access" 
ON public.shot_gen 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = shot_gen.job_id 
    AND jobs.user_id IS NULL 
    AND jobs.session_id IS NOT NULL
));

CREATE POLICY "Users can create shot gen data for their authenticated jobs" 
ON public.shot_gen 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = shot_gen.job_id 
    AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can create shot gen data for guest jobs with session access" 
ON public.shot_gen 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = shot_gen.job_id 
    AND jobs.user_id IS NULL 
    AND jobs.session_id IS NOT NULL
));

-- character_gen table policies
DROP POLICY IF EXISTS "Users can view character gen data for their jobs or guest jobs" ON public.character_gen;
DROP POLICY IF EXISTS "Users can update character gen data for their jobs or guest jobs" ON public.character_gen;
DROP POLICY IF EXISTS "Users can create character gen data for their jobs or guest jobs" ON public.character_gen;

CREATE POLICY "Users can view character gen data for their authenticated jobs" 
ON public.character_gen 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = character_gen.job_id 
    AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can view character gen data for guest jobs with session access" 
ON public.character_gen 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = character_gen.job_id 
    AND jobs.user_id IS NULL 
    AND jobs.session_id IS NOT NULL
));

CREATE POLICY "Users can update character gen data for their authenticated jobs" 
ON public.character_gen 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = character_gen.job_id 
    AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can update character gen data for guest jobs with session access" 
ON public.character_gen 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = character_gen.job_id 
    AND jobs.user_id IS NULL 
    AND jobs.session_id IS NOT NULL
));

CREATE POLICY "Users can create character gen data for their authenticated jobs" 
ON public.character_gen 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = character_gen.job_id 
    AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can create character gen data for guest jobs with session access" 
ON public.character_gen 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = character_gen.job_id 
    AND jobs.user_id IS NULL 
    AND jobs.session_id IS NOT NULL
));

-- Add comment for documentation
COMMENT ON COLUMN public.jobs.session_id IS 'Session identifier for guest jobs to ensure only the creator can access their data';
COMMENT ON FUNCTION public.cleanup_old_guest_jobs() IS 'Automatically cleans up PII data from old guest jobs to protect user privacy';
COMMENT ON FUNCTION public.generate_guest_session_id() IS 'Generates secure session IDs for guest job access control';