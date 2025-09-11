-- Create/update trigger functions for each section
CREATE OR REPLACE FUNCTION public.update_user_input_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_input IS DISTINCT FROM NEW.user_input THEN
    NEW.user_input_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_movie_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.movie_info IS DISTINCT FROM NEW.movie_info THEN
    NEW.movie_info_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_characters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.characters IS DISTINCT FROM NEW.characters THEN
    NEW.characters_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_props_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.props IS DISTINCT FROM NEW.props THEN
    NEW.props_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_timeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.timeline IS DISTINCT FROM NEW.timeline THEN
    NEW.timeline_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_music_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.music IS DISTINCT FROM NEW.music THEN
    NEW.music_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_storyboard_jobs_user_input_updated_at ON public.storyboard_jobs;
DROP TRIGGER IF EXISTS update_storyboard_jobs_movie_info_updated_at ON public.storyboard_jobs;
DROP TRIGGER IF EXISTS update_storyboard_jobs_characters_updated_at ON public.storyboard_jobs;
DROP TRIGGER IF EXISTS update_storyboard_jobs_props_updated_at ON public.storyboard_jobs;
DROP TRIGGER IF EXISTS update_storyboard_jobs_timeline_updated_at ON public.storyboard_jobs;
DROP TRIGGER IF EXISTS update_storyboard_jobs_music_updated_at ON public.storyboard_jobs;
DROP TRIGGER IF EXISTS set_updated_at ON public.storyboard_jobs;

-- Create triggers for each section
CREATE TRIGGER update_storyboard_jobs_user_input_updated_at
  BEFORE UPDATE ON public.storyboard_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_input_updated_at();

CREATE TRIGGER update_storyboard_jobs_movie_info_updated_at
  BEFORE UPDATE ON public.storyboard_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_movie_info_updated_at();

CREATE TRIGGER update_storyboard_jobs_characters_updated_at
  BEFORE UPDATE ON public.storyboard_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_characters_updated_at();

CREATE TRIGGER update_storyboard_jobs_props_updated_at
  BEFORE UPDATE ON public.storyboard_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_props_updated_at();

CREATE TRIGGER update_storyboard_jobs_timeline_updated_at
  BEFORE UPDATE ON public.storyboard_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timeline_updated_at();

CREATE TRIGGER update_storyboard_jobs_music_updated_at
  BEFORE UPDATE ON public.storyboard_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_music_updated_at();

-- Create general updated_at trigger (runs last)
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.storyboard_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();