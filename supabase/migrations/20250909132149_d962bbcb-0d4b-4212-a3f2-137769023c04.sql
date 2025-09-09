-- Add new columns to storyboard_jobs table for progressive sections
ALTER TABLE public.storyboard_jobs 
ADD COLUMN IF NOT EXISTS characters jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS characters_updated_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS props jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS props_updated_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS timeline jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS timeline_updated_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS music jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS music_updated_at timestamp with time zone DEFAULT NULL;

-- Create triggers to automatically update section-specific timestamps
CREATE OR REPLACE FUNCTION public.update_characters_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.characters IS DISTINCT FROM NEW.characters THEN
    NEW.characters_updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_props_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.props IS DISTINCT FROM NEW.props THEN
    NEW.props_updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_timeline_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.timeline IS DISTINCT FROM NEW.timeline THEN
    NEW.timeline_updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_music_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.music IS DISTINCT FROM NEW.music THEN
    NEW.music_updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

-- Create triggers for each section
DROP TRIGGER IF EXISTS update_characters_timestamp ON public.storyboard_jobs;
CREATE TRIGGER update_characters_timestamp
  BEFORE UPDATE ON public.storyboard_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_characters_updated_at();

DROP TRIGGER IF EXISTS update_props_timestamp ON public.storyboard_jobs;
CREATE TRIGGER update_props_timestamp
  BEFORE UPDATE ON public.storyboard_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_props_updated_at();

DROP TRIGGER IF EXISTS update_timeline_timestamp ON public.storyboard_jobs;
CREATE TRIGGER update_timeline_timestamp
  BEFORE UPDATE ON public.storyboard_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timeline_updated_at();

DROP TRIGGER IF EXISTS update_music_timestamp ON public.storyboard_jobs;
CREATE TRIGGER update_music_timestamp
  BEFORE UPDATE ON public.storyboard_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_music_updated_at();