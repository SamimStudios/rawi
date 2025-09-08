-- Update the link_guest_jobs_to_user function to accept session_id parameter
CREATE OR REPLACE FUNCTION public.link_guest_jobs_to_user(p_email text, p_session_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update guest jobs with this session_id to the authenticated user
  UPDATE jobs 
  SET user_id = auth.uid(), updated_at = now()
  WHERE session_id = p_session_id AND user_id IS NULL;
END;
$function$