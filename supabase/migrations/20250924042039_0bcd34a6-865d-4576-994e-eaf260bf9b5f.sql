-- Phase 2: Fix Critical Security Issues (Targeted)

-- 1. Fix trigger functions with missing search paths
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Update other critical functions to have proper search paths
CREATE OR REPLACE FUNCTION public.update_input_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update user_input_updated_at if user_input has actually changed
  IF OLD.user_input IS DISTINCT FROM NEW.user_input THEN
    NEW.user_input_updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_updated_at_trigger(p_schema text, p_table text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  trig_name text := 'set_updated_at';
  exists_bool boolean;
begin
  -- ensure the table actually has an updated_at column
  if not exists (
    select 1 from information_schema.columns
    where table_schema = p_schema
      and table_name   = p_table
      and column_name  = 'updated_at'
  ) then
    raise notice 'Table %.% has no updated_at column. Skipping trigger.', p_schema, p_table;
    return;
  end if;

  -- avoid duplicate triggers (CREATE TRIGGER IF NOT EXISTS isn't supported)
  select exists(
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = p_schema
      and c.relname = p_table
      and t.tgname  = trig_name
  ) into exists_bool;

  if not exists_bool then
    execute format(
      'create trigger %I
         before update on %I.%I
         for each row
         execute procedure public.trigger_set_updated_at()',
      trig_name, p_schema, p_table
    );
  end if;
end;
$$;

-- 3. Fix validation functions with proper search paths
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.t_node_definitions_touch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 4. Create a safer function that doesn't reference non-existent tables
CREATE OR REPLACE FUNCTION public.safe_refresh_job_node_index(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function is placeholder for when the actual job tables are created
  -- Currently just logs the request
  RAISE NOTICE 'Job node index refresh requested for job: %', p_job_id;
END;
$$;

-- 5. Create secure session management functions
CREATE OR REPLACE FUNCTION public.validate_session_token(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Basic token validation - can be enhanced later
  IF p_token IS NULL OR length(p_token) < 32 THEN
    RETURN false;
  END IF;
  
  -- Add more sophisticated validation as needed
  RETURN true;
END;
$$;

-- 6. Add rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id uuid, p_action text, p_limit integer DEFAULT 100, p_window_minutes integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_count integer;
BEGIN
  -- Count actions in the time window
  SELECT COUNT(*) INTO action_count
  FROM security_audit_log
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at > (now() - interval '1 minute' * p_window_minutes);
  
  -- Return true if under limit
  RETURN action_count < p_limit;
END;
$$;

-- 7. Create input validation function
CREATE OR REPLACE FUNCTION public.validate_json_structure(input_json jsonb, required_fields text[])
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  field text;
BEGIN
  -- Check if input is valid JSON object
  IF jsonb_typeof(input_json) != 'object' THEN
    RETURN false;
  END IF;
  
  -- Check required fields
  FOREACH field IN ARRAY required_fields
  LOOP
    IF NOT (input_json ? field) THEN
      RETURN false;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$;