-- Critical Security Fixes

-- 1. Fix templates table - remove public read access, require authentication
DROP POLICY IF EXISTS "allow read" ON public.templates;

-- Create proper authentication-based policy for templates
CREATE POLICY "Authenticated users can view templates" 
ON public.templates 
FOR SELECT 
TO authenticated
USING (true);

-- 2. Clean up legacy guest jobs with PII but no session_id (security vulnerability)
UPDATE public.jobs 
SET 
  email = NULL,
  name = NULL,
  face_image_url = NULL,
  updated_at = NOW()
WHERE user_id IS NULL 
  AND session_id IS NULL
  AND (
    email IS NOT NULL OR 
    name IS NOT NULL OR 
    face_image_url IS NOT NULL
  );

-- 3. Execute immediate cleanup of old guest job PII
SELECT public.cleanup_old_guest_jobs();

-- 4. Add constraint to prevent future guest jobs without session_id
ALTER TABLE public.jobs 
ADD CONSTRAINT check_guest_jobs_have_session 
CHECK (
  (user_id IS NOT NULL) OR 
  (user_id IS NULL AND session_id IS NOT NULL)
);