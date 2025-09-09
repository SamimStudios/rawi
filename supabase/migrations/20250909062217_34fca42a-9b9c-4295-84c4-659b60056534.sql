-- Add movie_info_updated_at column to storyboard_jobs table
ALTER TABLE storyboard_jobs 
ADD COLUMN movie_info_updated_at timestamp with time zone;

-- Create trigger function to automatically update movie_info_updated_at when movie_info changes
CREATE OR REPLACE FUNCTION update_movie_info_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only update movie_info_updated_at if movie_info has actually changed
  IF OLD.movie_info IS DISTINCT FROM NEW.movie_info THEN
    NEW.movie_info_updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER set_movie_info_updated_at
  BEFORE UPDATE ON storyboard_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_movie_info_updated_at();