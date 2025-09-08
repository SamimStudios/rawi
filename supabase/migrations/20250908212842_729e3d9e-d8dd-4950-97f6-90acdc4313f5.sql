-- Add movie_info column to storyboard_jobs table
ALTER TABLE public.storyboard_jobs 
ADD COLUMN movie_info jsonb DEFAULT '{}'::jsonb;