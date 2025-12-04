-- =============================================
-- F&B BRANDS MVP - DATABASE SCHEMA
-- =============================================

-- Enable storage for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('fnb-logos', 'fnb-logos', true),
  ('fnb-brand-assets', 'fnb-brand-assets', false),
  ('fnb-branch-photos', 'fnb-branch-photos', true),
  ('fnb-menu-photos', 'fnb-menu-photos', true),
  ('fnb-media-library', 'fnb-media-library', false),
  ('fnb-generated-content', 'fnb-generated-content', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for fnb-logos bucket
CREATE POLICY "Users can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fnb-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fnb-logos');

CREATE POLICY "Users can update their logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'fnb-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'fnb-logos' AND auth.uid() IS NOT NULL);

-- Storage policies for fnb-branch-photos bucket
CREATE POLICY "Users can upload branch photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fnb-branch-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view branch photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fnb-branch-photos');

CREATE POLICY "Users can update branch photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'fnb-branch-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete branch photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'fnb-branch-photos' AND auth.uid() IS NOT NULL);

-- Storage policies for fnb-menu-photos bucket
CREATE POLICY "Users can upload menu photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fnb-menu-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view menu photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fnb-menu-photos');

CREATE POLICY "Users can update menu photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'fnb-menu-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete menu photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'fnb-menu-photos' AND auth.uid() IS NOT NULL);

-- Storage policies for fnb-generated-content bucket
CREATE POLICY "Users can upload generated content" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fnb-generated-content' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view generated content" ON storage.objects
  FOR SELECT USING (bucket_id = 'fnb-generated-content');

CREATE POLICY "Users can update generated content" ON storage.objects
  FOR UPDATE USING (bucket_id = 'fnb-generated-content' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete generated content" ON storage.objects
  FOR DELETE USING (bucket_id = 'fnb-generated-content' AND auth.uid() IS NOT NULL);

-- Storage policies for fnb-brand-assets bucket (private)
CREATE POLICY "Users can upload brand assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fnb-brand-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own brand assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'fnb-brand-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update brand assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'fnb-brand-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete brand assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'fnb-brand-assets' AND auth.uid() IS NOT NULL);

-- Storage policies for fnb-media-library bucket (private)
CREATE POLICY "Users can upload media library" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fnb-media-library' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own media library" ON storage.objects
  FOR SELECT USING (bucket_id = 'fnb-media-library' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update media library" ON storage.objects
  FOR UPDATE USING (bucket_id = 'fnb-media-library' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete media library" ON storage.objects
  FOR DELETE USING (bucket_id = 'fnb-media-library' AND auth.uid() IS NOT NULL);

-- =============================================
-- TABLE 1: fnb_brands - Core brand information
-- =============================================
CREATE TABLE public.fnb_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Step 1: Basic Info
  brand_name TEXT NOT NULL,
  brand_slug TEXT NOT NULL,
  brand_type TEXT NOT NULL DEFAULT 'restaurant', -- restaurant, cafe, bakery, cloud_kitchen, other
  country TEXT NOT NULL DEFAULT 'Saudi Arabia',
  city TEXT,
  district TEXT,
  default_language TEXT NOT NULL DEFAULT 'ar', -- ar, en, ar_en
  brand_short_bio TEXT,
  brand_long_bio TEXT,
  price_level TEXT DEFAULT 'mid_range', -- budget, mid_range, premium
  
  -- Step 2: Visual Identity (JSONB)
  visual_identity JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   logo_primary: string (URL),
  --   logo_secondary: string (URL),
  --   primary_color_hex: string,
  --   secondary_color_hex: string,
  --   accent_color_hex: string,
  --   neutral_light_hex: string,
  --   neutral_dark_hex: string,
  --   primary_font_name: string,
  --   secondary_font_name: string,
  --   brand_guidelines_file: string (URL)
  -- }
  
  -- Step 3: Voice & Positioning (JSONB)
  voice JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   tone_of_voice: string[] (warm_friendly, premium_elegant, fun_playful, bold_edgy, calm_minimal),
  --   tone_notes: string,
  --   tagline: string,
  --   preferred_words: string,
  --   banned_words: string
  -- }
  
  -- Step 6: Menu General
  menu_file_url TEXT,
  currency TEXT DEFAULT 'SAR',
  menu_notes TEXT,
  
  -- Step 8: Media Library References (stored in fnb_brand_media table)
  inspiration_links TEXT,
  
  -- Step 9: Content Preferences (JSONB)
  preferences JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   content_goals: string[],
  --   target_posts_per_week: number,
  --   preferred_formats: string[],
  --   platforms: string[],
  --   allow_discounts: boolean,
  --   max_discount_percent: number,
  --   key_occasion_notes: string,
  --   content_risks_to_avoid: string
  -- }
  
  -- Step 10: Social Links (JSONB)
  social_links JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   instagram_url: string,
  --   tiktok_url: string,
  --   snapchat_url: string,
  --   x_url: string,
  --   website_url: string,
  --   delivery_apps_links: string,
  --   whatsapp_number: string,
  --   contact_email: string
  -- }
  
  -- Step 11: Account Owner (JSONB)
  account_owner JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   name: string,
  --   email: string,
  --   phone: string,
  --   preferred_contact_method: string (whatsapp, email, phone_call)
  -- }
  
  -- Metadata
  setup_progress INTEGER DEFAULT 0, -- 0-100 percentage
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint on brand_slug per user
CREATE UNIQUE INDEX fnb_brands_user_slug_idx ON public.fnb_brands(user_id, brand_slug);

-- Enable RLS
ALTER TABLE public.fnb_brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own brands" ON public.fnb_brands
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brands" ON public.fnb_brands
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brands" ON public.fnb_brands
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brands" ON public.fnb_brands
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER fnb_brands_updated_at
  BEFORE UPDATE ON public.fnb_brands
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =============================================
-- TABLE 2: fnb_branches - Branch locations
-- =============================================
CREATE TABLE public.fnb_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.fnb_brands(id) ON DELETE CASCADE,
  
  -- Branch Info
  branch_name TEXT NOT NULL,
  branch_code TEXT,
  branch_type TEXT DEFAULT 'dine_in', -- dine_in, delivery_only, kiosk, food_truck
  
  -- Location
  branch_country TEXT DEFAULT 'Saudi Arabia',
  branch_city TEXT,
  branch_district TEXT,
  branch_address_line TEXT,
  branch_maps_url TEXT,
  
  -- Operations
  branch_opening_hours TEXT,
  branch_seating_capacity INTEGER,
  branch_tags TEXT[] DEFAULT '{}', -- family_friendly, outdoor_seating, drive_thru, smoking_area
  
  -- Photos (JSONB)
  photos JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   interior: string[],
  --   exterior: string[],
  --   kitchen: string[],
  --   staff: string[],
  --   hero: string[]
  -- }
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fnb_branches ENABLE ROW LEVEL SECURITY;

-- RLS Policies (through brand ownership)
CREATE POLICY "Users can view branches of their brands" ON public.fnb_branches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.fnb_brands WHERE id = brand_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create branches for their brands" ON public.fnb_branches
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.fnb_brands WHERE id = brand_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update branches of their brands" ON public.fnb_branches
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.fnb_brands WHERE id = brand_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete branches of their brands" ON public.fnb_branches
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.fnb_brands WHERE id = brand_id AND user_id = auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER fnb_branches_updated_at
  BEFORE UPDATE ON public.fnb_branches
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =============================================
-- TABLE 3: fnb_menu_items - Menu items
-- =============================================
CREATE TABLE public.fnb_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.fnb_brands(id) ON DELETE CASCADE,
  
  -- Item Info
  item_name_ar TEXT NOT NULL,
  item_name_en TEXT,
  item_category TEXT,
  item_description TEXT,
  
  -- Pricing
  item_price NUMERIC(10,2),
  item_currency TEXT DEFAULT 'SAR',
  
  -- Tags & Flags
  item_tags TEXT[] DEFAULT '{}', -- spicy, vegetarian, vegan, kids, bestseller, new
  item_is_signature BOOLEAN DEFAULT false,
  item_all_branches BOOLEAN DEFAULT true,
  item_branches UUID[] DEFAULT '{}', -- specific branch IDs if not all
  
  -- Media
  item_photo_url TEXT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fnb_menu_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view menu items of their brands" ON public.fnb_menu_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.fnb_brands WHERE id = brand_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create menu items for their brands" ON public.fnb_menu_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.fnb_brands WHERE id = brand_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update menu items of their brands" ON public.fnb_menu_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.fnb_brands WHERE id = brand_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete menu items of their brands" ON public.fnb_menu_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.fnb_brands WHERE id = brand_id AND user_id = auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER fnb_menu_items_updated_at
  BEFORE UPDATE ON public.fnb_menu_items
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =============================================
-- TABLE 4: fnb_brand_media - Media library
-- =============================================
CREATE TABLE public.fnb_brand_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.fnb_brands(id) ON DELETE CASCADE,
  
  -- Media Info
  media_type TEXT NOT NULL, -- previous_photo, previous_video, raw_asset
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Metadata
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fnb_brand_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view media of their brands" ON public.fnb_brand_media
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.fnb_brands WHERE id = brand_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create media for their brands" ON public.fnb_brand_media
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.fnb_brands WHERE id = brand_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete media of their brands" ON public.fnb_brand_media
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.fnb_brands WHERE id = brand_id AND user_id = auth.uid())
  );

-- =============================================
-- TABLE 5: fnb_content_requests - Generation queue
-- =============================================
CREATE TABLE public.fnb_content_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.fnb_brands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Request Details
  request_type TEXT NOT NULL DEFAULT 'manual', -- manual, scheduled
  content_type TEXT NOT NULL, -- image, video, both
  prompt TEXT NOT NULL,
  
  -- Options
  options JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   style: string,
  --   aspect_ratio: string,
  --   quantity: number,
  --   include_caption: boolean,
  --   caption_languages: string[],
  --   target_platform: string
  -- }
  
  -- Status & Result
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  result JSONB, -- Filled by n8n with generated content URLs and captions
  error_message TEXT,
  
  -- Timing
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fnb_content_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their content requests" ON public.fnb_content_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create content requests" ON public.fnb_content_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their content requests" ON public.fnb_content_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can manage all content requests" ON public.fnb_content_requests
  FOR ALL USING (true);

-- Trigger for updated_at
CREATE TRIGGER fnb_content_requests_updated_at
  BEFORE UPDATE ON public.fnb_content_requests
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =============================================
-- TABLE 6: fnb_generated_content - Generated outputs
-- =============================================
CREATE TABLE public.fnb_generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.fnb_brands(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.fnb_content_requests(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  
  -- Content Info
  content_type TEXT NOT NULL, -- image, video
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Captions (JSONB for multiple languages)
  captions JSONB DEFAULT '{}'::jsonb,
  -- Structure: { ar: string, en: string }
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Structure: { width, height, duration, format, style, prompt }
  
  -- Status
  is_favorite BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  used_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fnb_generated_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their generated content" ON public.fnb_generated_content
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create generated content" ON public.fnb_generated_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their generated content" ON public.fnb_generated_content
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their generated content" ON public.fnb_generated_content
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can manage all generated content" ON public.fnb_generated_content
  FOR ALL USING (true);

-- =============================================
-- TABLE 7: fnb_posts - Posted content (placeholder)
-- =============================================
CREATE TABLE public.fnb_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.fnb_brands(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.fnb_generated_content(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  
  -- Post Info
  platform TEXT NOT NULL, -- instagram, tiktok, snapchat, x
  post_type TEXT NOT NULL, -- organic, paid
  post_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, published, failed
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Content
  caption TEXT,
  hashtags TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fnb_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their posts" ON public.fnb_posts
  FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER fnb_posts_updated_at
  BEFORE UPDATE ON public.fnb_posts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =============================================
-- TABLE 8: fnb_performance_metrics - Analytics (placeholder)
-- =============================================
CREATE TABLE public.fnb_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.fnb_brands(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.fnb_posts(id) ON DELETE CASCADE,
  
  -- Metrics
  platform TEXT NOT NULL,
  metric_date DATE NOT NULL,
  
  -- Engagement
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  -- Business (from POS integration - placeholder)
  attributed_orders INTEGER DEFAULT 0,
  attributed_revenue NUMERIC(10,2) DEFAULT 0,
  
  -- Metadata
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fnb_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view metrics of their brands" ON public.fnb_performance_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.fnb_brands WHERE id = brand_id AND user_id = auth.uid())
  );

CREATE POLICY "System can manage all metrics" ON public.fnb_performance_metrics
  FOR ALL USING (true);

-- =============================================
-- Helper function to generate brand slug
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_fnb_brand_slug(p_brand_name TEXT, p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase and replace spaces/special chars with hyphens
  base_slug := lower(regexp_replace(p_brand_name, '[^a-zA-Z0-9\u0600-\u06FF]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- If empty, use random
  IF base_slug = '' THEN
    base_slug := 'brand';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and increment if needed
  WHILE EXISTS (SELECT 1 FROM public.fnb_brands WHERE brand_slug = final_slug AND user_id = p_user_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;