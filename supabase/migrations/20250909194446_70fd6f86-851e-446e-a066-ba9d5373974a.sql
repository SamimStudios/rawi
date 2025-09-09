-- Rename functions table to n8n_functions
ALTER TABLE public.functions RENAME TO n8n_functions;

-- Remove function_id column from storyboard_jobs table since storyboard jobs don't need N8N functions
ALTER TABLE public.storyboard_jobs DROP COLUMN IF EXISTS function_id;