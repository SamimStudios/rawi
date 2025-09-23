-- Create a public view that references the app schema field_registry
CREATE OR REPLACE VIEW public.field_registry AS
SELECT * FROM app.field_registry;

-- Grant access to the view for anon and authenticated users
GRANT SELECT ON public.field_registry TO anon, authenticated;