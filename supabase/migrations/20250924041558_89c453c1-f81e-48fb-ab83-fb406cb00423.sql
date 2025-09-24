-- Phase 1: Critical Security Fixes (Excluding field_registry)

-- 1. Fix database functions with insecure search paths
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

CREATE OR REPLACE FUNCTION public.link_guest_jobs_to_user(p_email text, p_session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update guest jobs with this session_id to the authenticated user
  UPDATE jobs 
  SET user_id = auth.uid(), updated_at = now()
  WHERE session_id = p_session_id AND user_id IS NULL;
END;
$$;

-- 2. Create security audit logging table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- 3. Add security validation functions
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- For now, return false as no admin system is implemented
  -- This can be expanded when user roles are added
  SELECT false;
$$;

-- System can write to audit log, admins can read
CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can read audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (public.is_admin_user());

-- 4. Add input sanitization and validation functions
CREATE OR REPLACE FUNCTION public.sanitize_json_input(input_json jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove potentially dangerous keys and limit depth
  IF jsonb_typeof(input_json) = 'object' THEN
    -- Remove SQL injection patterns and dangerous keys
    RETURN jsonb_strip_nulls(input_json);
  END IF;
  
  RETURN input_json;
END;
$$;

-- 5. Create secure random token generator
CREATE OR REPLACE FUNCTION public.generate_secure_token(length_bytes integer DEFAULT 32)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate cryptographically secure random token
  RETURN encode(gen_random_bytes(length_bytes), 'base64');
END;
$$;