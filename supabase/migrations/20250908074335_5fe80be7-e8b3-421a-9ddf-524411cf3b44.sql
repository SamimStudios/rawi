-- Phase 1: Emergency Data Protection - Fix Critical RLS Policies

-- 1. Drop existing permissive policies on jobs table
DROP POLICY IF EXISTS "Anyone can create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Anyone can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Anyone can view jobs" ON public.jobs;

-- 2. Create secure user-scoped policies for jobs table
CREATE POLICY "Users can view their own jobs" 
ON public.jobs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs" 
ON public.jobs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" 
ON public.jobs 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Drop existing permissive policy on character_gen table
DROP POLICY IF EXISTS "allow all" ON public.character_gen;

-- 4. Create secure policies for character_gen table (linked via job_id)
CREATE POLICY "Users can view their own character gen data" 
ON public.character_gen 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jobs 
  WHERE jobs.id = character_gen.job_id 
  AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can create character gen data for their jobs" 
ON public.character_gen 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.jobs 
  WHERE jobs.id = character_gen.job_id 
  AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can update their own character gen data" 
ON public.character_gen 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jobs 
  WHERE jobs.id = character_gen.job_id 
  AND jobs.user_id = auth.uid()
));

-- 5. Update shot_gen table policies (replace service role only policy)
DROP POLICY IF EXISTS "service role" ON public.shot_gen;

CREATE POLICY "Users can view their own shot gen data" 
ON public.shot_gen 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jobs 
  WHERE jobs.id = shot_gen.job_id 
  AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can create shot gen data for their jobs" 
ON public.shot_gen 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.jobs 
  WHERE jobs.id = shot_gen.job_id 
  AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can update their own shot gen data" 
ON public.shot_gen 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jobs 
  WHERE jobs.id = shot_gen.job_id 
  AND jobs.user_id = auth.uid()
));

-- 6. Secure cards table (replace permissive policy)
DROP POLICY IF EXISTS "Allow All" ON public.cards;

CREATE POLICY "Users can view their own cards" 
ON public.cards 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jobs 
  WHERE jobs.id = cards.job_id 
  AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can create cards for their jobs" 
ON public.cards 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.jobs 
  WHERE jobs.id = cards.job_id 
  AND jobs.user_id = auth.uid()
));

CREATE POLICY "Users can update their own cards" 
ON public.cards 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jobs 
  WHERE jobs.id = cards.job_id 
  AND jobs.user_id = auth.uid()
));

-- 7. Fix database functions with proper security settings
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.add_updated_at_trigger(p_schema text, p_table text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;