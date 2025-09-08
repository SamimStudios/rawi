-- Create functions reference table
CREATE TABLE public.functions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0, -- Price in credits
  expected_payload JSONB,
  description TEXT,
  test_webhook TEXT,
  production_webhook TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.functions ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing functions (public access for active functions)
CREATE POLICY "Anyone can view active functions" 
ON public.functions 
FOR SELECT 
USING (active = true);

-- Create policy for system management
CREATE POLICY "System can manage functions" 
ON public.functions 
FOR ALL 
USING (true);

-- Drop existing storyboard_jobs table if it exists
DROP TABLE IF EXISTS public.storyboard_jobs CASCADE;

-- Create simplified storyboard_jobs table
CREATE TABLE public.storyboard_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  function_id UUID NOT NULL,
  user_input JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  stage TEXT NOT NULL DEFAULT 'created',
  result_data JSONB,
  n8n_webhook_sent BOOLEAN NOT NULL DEFAULT false,
  n8n_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.storyboard_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for storyboard_jobs
CREATE POLICY "Users can view their own storyboard jobs" 
ON public.storyboard_jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view guest storyboard jobs with session access" 
ON public.storyboard_jobs 
FOR SELECT 
USING (user_id IS NULL AND session_id IS NOT NULL);

CREATE POLICY "Users can create their own storyboard jobs" 
ON public.storyboard_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create guest storyboard jobs" 
ON public.storyboard_jobs 
FOR INSERT 
WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

CREATE POLICY "Users can update their own storyboard jobs" 
ON public.storyboard_jobs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update guest storyboard jobs with session access" 
ON public.storyboard_jobs 
FOR UPDATE 
USING (user_id IS NULL AND session_id IS NOT NULL);

-- Add updated_at triggers
CREATE TRIGGER update_functions_updated_at
  BEFORE UPDATE ON public.functions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_storyboard_jobs_updated_at
  BEFORE UPDATE ON public.storyboard_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the start job function
INSERT INTO public.functions (
  name,
  type,
  price,
  expected_payload,
  description,
  test_webhook,
  production_webhook
) VALUES (
  'start-storyboard-job',
  'storyboard',
  10, -- 10 credits
  '{"lead_name": "string", "lead_gender": "string", "language": "string", "accent": "string", "genres": "array", "prompt": "string", "face_ref_url": "string"}',
  'Creates a new storyboard job with the provided lead character details and preferences',
  'https://samim-studios.app.n8n.cloud/webhook-test/start-job',
  'https://samim-studios.app.n8n.cloud/webhook/start-job'
);

-- Create indexes
CREATE INDEX idx_storyboard_jobs_user_id ON public.storyboard_jobs(user_id);
CREATE INDEX idx_storyboard_jobs_session_id ON public.storyboard_jobs(session_id);
CREATE INDEX idx_storyboard_jobs_function_id ON public.storyboard_jobs(function_id);
CREATE INDEX idx_functions_type ON public.functions(type);
CREATE INDEX idx_functions_active ON public.functions(active);