-- Create a clean storyboard_jobs table
CREATE TABLE public.storyboard_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NULL,
  session_id TEXT NULL,
  
  -- Form fields
  lead_name TEXT NOT NULL,
  lead_gender TEXT NOT NULL CHECK (lead_gender IN ('male', 'female')),
  face_ref_url TEXT NULL,
  language TEXT NOT NULL,
  accent TEXT NOT NULL,
  genres TEXT[] NOT NULL DEFAULT '{}',
  prompt TEXT NULL,
  
  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stage TEXT NOT NULL DEFAULT 'created' CHECK (stage IN ('created', 'character_generation', 'storyboard_creation', 'completed')),
  
  -- N8N integration
  n8n_webhook_sent BOOLEAN NOT NULL DEFAULT FALSE,
  n8n_response JSONB NULL,
  
  -- Result data
  result_data JSONB NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.storyboard_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Users can view their own storyboard jobs" 
ON public.storyboard_jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own storyboard jobs" 
ON public.storyboard_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own storyboard jobs" 
ON public.storyboard_jobs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for guest users
CREATE POLICY "Users can view guest storyboard jobs with session access" 
ON public.storyboard_jobs 
FOR SELECT 
USING ((user_id IS NULL) AND (session_id IS NOT NULL));

CREATE POLICY "Users can create guest storyboard jobs" 
ON public.storyboard_jobs 
FOR INSERT 
WITH CHECK ((user_id IS NULL) AND (session_id IS NOT NULL));

CREATE POLICY "Users can update guest storyboard jobs with session access" 
ON public.storyboard_jobs 
FOR UPDATE 
USING ((user_id IS NULL) AND (session_id IS NOT NULL));

-- Add updated_at trigger
CREATE TRIGGER update_storyboard_jobs_updated_at
BEFORE UPDATE ON public.storyboard_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_storyboard_jobs_user_id ON public.storyboard_jobs(user_id);
CREATE INDEX idx_storyboard_jobs_session_id ON public.storyboard_jobs(session_id);
CREATE INDEX idx_storyboard_jobs_status ON public.storyboard_jobs(status);