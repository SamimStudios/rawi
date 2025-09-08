-- Update templates RLS policy to allow public access
DROP POLICY IF EXISTS "Authenticated users can view templates" ON public.templates;

CREATE POLICY "Anyone can view templates" 
ON public.templates 
FOR SELECT 
USING (true);