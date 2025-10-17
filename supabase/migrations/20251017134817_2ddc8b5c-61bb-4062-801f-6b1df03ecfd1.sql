-- ================================================
-- PHASE 2: Database-Driven Translation System
-- ================================================

-- Main translations table to store translation keys
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Translation values for each language
CREATE TABLE IF NOT EXISTS public.translation_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_id UUID NOT NULL REFERENCES public.translations(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('en', 'ar')),
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(translation_id, language)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_translations_key ON public.translations(key);
CREATE INDEX IF NOT EXISTS idx_translations_category ON public.translations(category);
CREATE INDEX IF NOT EXISTS idx_translation_values_translation_id ON public.translation_values(translation_id);
CREATE INDEX IF NOT EXISTS idx_translation_values_language ON public.translation_values(language);

-- Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read translations
CREATE POLICY "Anyone can read translations" 
  ON public.translations FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can read translation values" 
  ON public.translation_values FOR SELECT 
  USING (true);

-- Only authenticated users can manage translations (will add proper admin check later)
CREATE POLICY "Authenticated users can manage translations" 
  ON public.translations FOR ALL 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage translation values" 
  ON public.translation_values FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Triggers to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_translation_values_updated_at
  BEFORE UPDATE ON public.translation_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();