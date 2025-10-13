-- Create template-images bucket for storing template preview images
INSERT INTO storage.buckets (id, name, public)
VALUES ('template-images', 'template-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to template images
CREATE POLICY "Public can view template images"
ON storage.objects FOR SELECT
USING (bucket_id = 'template-images');

-- Allow authenticated users to upload template images
CREATE POLICY "Authenticated users can upload template images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'template-images');

-- Allow authenticated users to update template images
CREATE POLICY "Authenticated users can update template images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'template-images');