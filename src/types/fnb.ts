// F&B Brands MVP Types

export interface FnbBrand {
  id: string;
  user_id: string;
  
  // Step 1: Basic Info
  brand_name: string;
  brand_slug: string;
  brand_type: 'restaurant' | 'cafe' | 'bakery' | 'cloud_kitchen' | 'other';
  country: string;
  city?: string;
  district?: string;
  default_language: 'ar' | 'en' | 'ar_en';
  brand_short_bio?: string;
  brand_long_bio?: string;
  price_level: 'budget' | 'mid_range' | 'premium';
  
  // Step 2: Visual Identity
  visual_identity: VisualIdentity;
  
  // Step 3: Voice & Positioning
  voice: BrandVoice;
  
  // Step 6: Menu General
  menu_file_url?: string;
  currency: string;
  menu_notes?: string;
  
  // Step 8: Media Library
  inspiration_links?: string;
  
  // Step 9: Content Preferences
  preferences: ContentPreferences;
  
  // Step 10: Social Links
  social_links: SocialLinks;
  
  // Step 11: Account Owner
  account_owner: AccountOwner;
  
  // Metadata
  setup_progress: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VisualIdentity {
  logo_primary?: string;
  logo_secondary?: string;
  primary_color_hex?: string;
  secondary_color_hex?: string;
  accent_color_hex?: string;
  neutral_light_hex?: string;
  neutral_dark_hex?: string;
  primary_font_name?: string;
  secondary_font_name?: string;
  brand_guidelines_file?: string;
}

export interface BrandVoice {
  tone_of_voice?: string[];
  tone_notes?: string;
  tagline?: string;
  preferred_words?: string;
  banned_words?: string;
}

export interface ContentPreferences {
  content_goals?: string[];
  target_posts_per_week?: number;
  preferred_formats?: string[];
  platforms?: string[];
  allow_discounts?: boolean;
  max_discount_percent?: number;
  key_occasion_notes?: string;
  content_risks_to_avoid?: string;
}

export interface SocialLinks {
  instagram_url?: string;
  tiktok_url?: string;
  snapchat_url?: string;
  x_url?: string;
  website_url?: string;
  delivery_apps_links?: string;
  whatsapp_number?: string;
  contact_email?: string;
}

export interface AccountOwner {
  name?: string;
  email?: string;
  phone?: string;
  preferred_contact_method?: 'whatsapp' | 'email' | 'phone_call';
}

export interface FnbBranch {
  id: string;
  brand_id: string;
  branch_name: string;
  branch_code?: string;
  branch_type: 'dine_in' | 'delivery_only' | 'kiosk' | 'food_truck';
  branch_country: string;
  branch_city?: string;
  branch_district?: string;
  branch_address_line?: string;
  branch_maps_url?: string;
  branch_opening_hours?: string;
  branch_seating_capacity?: number;
  branch_tags: string[];
  photos: BranchPhotos;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BranchPhotos {
  interior?: string[];
  exterior?: string[];
  kitchen?: string[];
  staff?: string[];
  hero?: string[];
}

export interface FnbMenuItem {
  id: string;
  brand_id: string;
  item_name_ar: string;
  item_name_en?: string;
  item_category?: string;
  item_description?: string;
  item_price?: number;
  item_currency: string;
  item_tags: string[];
  item_is_signature: boolean;
  item_all_branches: boolean;
  item_branches: string[];
  item_photo_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FnbContentRequest {
  id: string;
  brand_id: string;
  user_id: string;
  request_type: 'manual' | 'scheduled';
  content_type: 'image' | 'video' | 'both';
  prompt: string;
  options: ContentRequestOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ContentRequestResult;
  error_message?: string;
  scheduled_for?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentRequestOptions {
  style?: string;
  aspect_ratio?: string;
  quantity?: number;
  include_caption?: boolean;
  caption_languages?: string[];
  target_platform?: string;
}

export interface ContentRequestResult {
  images?: GeneratedContentItem[];
  videos?: GeneratedContentItem[];
  captions?: {
    ar?: string;
    en?: string;
  };
}

export interface GeneratedContentItem {
  url: string;
  thumbnail_url?: string;
  metadata?: Record<string, unknown>;
}

export interface FnbGeneratedContent {
  id: string;
  brand_id: string;
  request_id?: string;
  user_id: string;
  content_type: 'image' | 'video';
  file_url: string;
  thumbnail_url?: string;
  captions: {
    ar?: string;
    en?: string;
  };
  metadata: Record<string, unknown>;
  is_favorite: boolean;
  is_archived: boolean;
  used_count: number;
  created_at: string;
}

export interface FnbPost {
  id: string;
  brand_id: string;
  content_id?: string;
  user_id: string;
  platform: 'instagram' | 'tiktok' | 'snapchat' | 'x';
  post_type: 'organic' | 'paid';
  post_url?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_for?: string;
  published_at?: string;
  caption?: string;
  hashtags?: string[];
  created_at: string;
  updated_at: string;
}

export interface FnbPerformanceMetrics {
  id: string;
  brand_id: string;
  post_id?: string;
  platform: string;
  metric_date: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  attributed_orders: number;
  attributed_revenue: number;
  raw_data: Record<string, unknown>;
  created_at: string;
}

// Form data types for brand setup
export interface BrandBasicInfoForm {
  brand_name: string;
  brand_type: string;
  country: string;
  city: string;
  district: string;
  default_language: string;
  brand_short_bio: string;
  brand_long_bio: string;
  price_level: string;
}

export interface BrandVisualIdentityForm {
  logo_primary?: File | string;
  logo_secondary?: File | string;
  primary_color_hex: string;
  secondary_color_hex: string;
  accent_color_hex: string;
  neutral_light_hex: string;
  neutral_dark_hex: string;
  primary_font_name: string;
  secondary_font_name: string;
  brand_guidelines_file?: File | string;
}

export interface BrandVoiceForm {
  tone_of_voice: string[];
  tone_notes: string;
  tagline: string;
  preferred_words: string;
  banned_words: string;
}

// Constants
export const BRAND_TYPES = ['restaurant', 'cafe', 'bakery', 'cloud_kitchen', 'other'] as const;
export const PRICE_LEVELS = ['budget', 'mid_range', 'premium'] as const;
export const LANGUAGES = ['ar', 'en', 'ar_en'] as const;
export const BRANCH_TYPES = ['dine_in', 'delivery_only', 'kiosk', 'food_truck'] as const;
export const TONE_OPTIONS = ['warm_friendly', 'premium_elegant', 'fun_playful', 'bold_edgy', 'calm_minimal'] as const;
export const CONTENT_GOALS = ['brand_awareness', 'highlight_signature_dishes', 'promote_offers', 'push_delivery', 'push_dine_in'] as const;
export const CONTENT_FORMATS = ['feed_post', 'story', 'reel', 'tiktok_video'] as const;
export const PLATFORMS = ['instagram', 'tiktok', 'snapchat', 'x'] as const;
export const BRANCH_TAGS = ['family_friendly', 'outdoor_seating', 'drive_thru', 'smoking_area'] as const;
export const MENU_ITEM_TAGS = ['spicy', 'vegetarian', 'vegan', 'kids', 'bestseller', 'new'] as const;
export const CURRENCIES = ['SAR', 'AED', 'USD'] as const;
export const COUNTRIES = ['Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Bahrain', 'Oman', 'Egypt', 'Jordan'] as const;
