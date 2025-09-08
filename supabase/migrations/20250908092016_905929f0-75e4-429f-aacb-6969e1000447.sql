-- Critical Security Fixes - Handle legacy data properly

-- 1. Fix templates table - remove public read access, require authentication
DROP POLICY IF EXISTS "allow read" ON public.templates;

-- Create proper authentication-based policy for templates
CREATE POLICY "Authenticated users can view templates" 
ON public.templates 
FOR SELECT 
TO authenticated
USING (true);

-- 2. Handle legacy guest jobs without session_id (security vulnerability)
-- Option A: Assign secure session IDs to existing guest jobs without session_id
UPDATE public.jobs 
SET session_id = public.generate_guest_session_id()
WHERE user_id IS NULL AND session_id IS NULL;

-- 3. Clean up PII from guest jobs older than 24 hours
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

-- 4. Execute full cleanup of old guest job PII  
SELECT public.cleanup_old_guest_jobs();

-- 5. Now add constraint to prevent future guest jobs without session_id
ALTER TABLE public.jobs 
ADD CONSTRAINT check_guest_jobs_have_session 
CHECK (
  (user_id IS NOT NULL) OR 
  (user_id IS NULL AND session_id IS NOT NULL)
);