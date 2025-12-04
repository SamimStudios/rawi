import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Check, ArrowLeft, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFnbBrands, useFnbBrand, useFnbBranches, useFnbMenuItems } from '@/hooks/useFnbBrands';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  BRAND_TYPES, 
  PRICE_LEVELS, 
  LANGUAGES, 
  TONE_OPTIONS,
  CONTENT_GOALS,
  CONTENT_FORMATS,
  PLATFORMS,
  COUNTRIES 
} from '@/types/fnb';

interface StepConfig {
  id: string;
  titleKey: string;
  descriptionKey: string;
  fields: string[];
}

const SETUP_STEPS: StepConfig[] = [
  { id: 'basic', titleKey: 'fnb.step1Title', descriptionKey: 'fnb.step1Desc', fields: ['brand_name', 'brand_type', 'country', 'city', 'district', 'default_language', 'brand_short_bio', 'brand_long_bio', 'price_level'] },
  { id: 'visual', titleKey: 'fnb.step2Title', descriptionKey: 'fnb.step2Desc', fields: ['logo_primary', 'primary_color_hex', 'secondary_color_hex', 'accent_color_hex', 'primary_font_name'] },
  { id: 'voice', titleKey: 'fnb.step3Title', descriptionKey: 'fnb.step3Desc', fields: ['tone_of_voice', 'tagline', 'preferred_words', 'banned_words'] },
  { id: 'branches', titleKey: 'fnb.step4Title', descriptionKey: 'fnb.step4Desc', fields: [] },
  { id: 'branch_photos', titleKey: 'fnb.step5Title', descriptionKey: 'fnb.step5Desc', fields: [] },
  { id: 'menu_file', titleKey: 'fnb.step6Title', descriptionKey: 'fnb.step6Desc', fields: ['menu_file_url', 'currency', 'menu_notes'] },
  { id: 'menu_items', titleKey: 'fnb.step7Title', descriptionKey: 'fnb.step7Desc', fields: [] },
  { id: 'media', titleKey: 'fnb.step8Title', descriptionKey: 'fnb.step8Desc', fields: ['inspiration_links'] },
  { id: 'preferences', titleKey: 'fnb.step9Title', descriptionKey: 'fnb.step9Desc', fields: ['content_goals', 'target_posts_per_week', 'preferred_formats', 'platforms'] },
  { id: 'social', titleKey: 'fnb.step10Title', descriptionKey: 'fnb.step10Desc', fields: ['instagram_url', 'tiktok_url', 'website_url', 'whatsapp_number'] },
  { id: 'owner', titleKey: 'fnb.step11Title', descriptionKey: 'fnb.step11Desc', fields: ['account_owner_name', 'account_owner_email', 'account_owner_phone'] },
];

export default function BrandSetup() {
  const { brandId } = useParams();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { createBrand, updateBrand } = useFnbBrands();
  const { data: existingBrand, isLoading } = useFnbBrand(brandId);
  
  const [openSteps, setOpenSteps] = useState<string[]>(['basic']);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [formData, setFormData] = useState<{
    brand_name: string;
    brand_type: 'restaurant' | 'cafe' | 'bakery' | 'cloud_kitchen' | 'other';
    country: string;
    city: string;
    district: string;
    default_language: 'ar' | 'en' | 'ar_en';
    brand_short_bio: string;
    brand_long_bio: string;
    price_level: 'budget' | 'mid_range' | 'premium';
    visual_identity: Record<string, string>;
    voice: { tone_of_voice: string[]; tone_notes: string; tagline: string; preferred_words: string; banned_words: string };
    menu_file_url: string;
    currency: string;
    menu_notes: string;
    inspiration_links: string;
    preferences: { content_goals: string[]; target_posts_per_week: number; preferred_formats: string[]; platforms: string[]; allow_discounts: boolean; max_discount_percent: number; key_occasion_notes: string; content_risks_to_avoid: string };
    social_links: Record<string, string>;
    account_owner: { name: string; email: string; phone: string; preferred_contact_method: 'whatsapp' | 'email' | 'phone_call' };
  }>({
    brand_name: '',
    brand_type: 'restaurant',
    country: 'Saudi Arabia',
    city: '',
    district: '',
    default_language: 'ar',
    brand_short_bio: '',
    brand_long_bio: '',
    price_level: 'mid_range',
    visual_identity: {
      logo_primary: '',
      logo_secondary: '',
      primary_color_hex: '#6366f1',
      secondary_color_hex: '#8b5cf6',
      accent_color_hex: '#f59e0b',
      neutral_light_hex: '#f8fafc',
      neutral_dark_hex: '#1e293b',
      primary_font_name: '',
      secondary_font_name: '',
    },
    voice: {
      tone_of_voice: [] as string[],
      tone_notes: '',
      tagline: '',
      preferred_words: '',
      banned_words: '',
    },
    menu_file_url: '',
    currency: 'SAR',
    menu_notes: '',
    inspiration_links: '',
    preferences: {
      content_goals: [] as string[],
      target_posts_per_week: 3,
      preferred_formats: [] as string[],
      platforms: [] as string[],
      allow_discounts: true,
      max_discount_percent: 20,
      key_occasion_notes: '',
      content_risks_to_avoid: '',
    },
    social_links: {
      instagram_url: '',
      tiktok_url: '',
      snapchat_url: '',
      x_url: '',
      website_url: '',
      delivery_apps_links: '',
      whatsapp_number: '',
      contact_email: '',
    },
    account_owner: {
      name: '',
      email: '',
      phone: '',
      preferred_contact_method: 'whatsapp' as const,
    },
  });

  // Load existing brand data
  useEffect(() => {
    if (existingBrand) {
      setFormData({
        brand_name: existingBrand.brand_name || '',
        brand_type: existingBrand.brand_type || 'restaurant',
        country: existingBrand.country || 'Saudi Arabia',
        city: existingBrand.city || '',
        district: existingBrand.district || '',
        default_language: existingBrand.default_language || 'ar',
        brand_short_bio: existingBrand.brand_short_bio || '',
        brand_long_bio: existingBrand.brand_long_bio || '',
        price_level: existingBrand.price_level || 'mid_range',
        visual_identity: { ...formData.visual_identity, ...existingBrand.visual_identity },
        voice: { ...formData.voice, ...existingBrand.voice },
        menu_file_url: existingBrand.menu_file_url || '',
        currency: existingBrand.currency || 'SAR',
        menu_notes: existingBrand.menu_notes || '',
        inspiration_links: existingBrand.inspiration_links || '',
        preferences: { ...formData.preferences, ...existingBrand.preferences },
        social_links: { ...formData.social_links, ...existingBrand.social_links },
        account_owner: { ...formData.account_owner, ...existingBrand.account_owner },
      });
    }
  }, [existingBrand]);

  const toggleStep = (stepId: string) => {
    setOpenSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const calculateProgress = () => {
    let filled = 0;
    let total = 0;

    // Count filled fields
    if (formData.brand_name) filled++;
    if (formData.brand_short_bio) filled++;
    if (formData.city) filled++;
    if (formData.visual_identity.logo_primary) filled++;
    if (formData.visual_identity.primary_color_hex) filled++;
    if (formData.voice.tagline) filled++;
    if (formData.social_links.instagram_url) filled++;
    if (formData.account_owner.name) filled++;
    
    total = 8; // Key fields

    return Math.round((filled / total) * 100);
  };

  const handleSave = async () => {
    if (!formData.brand_name.trim()) {
      toast.error(t('fnb.brandNameRequired'));
      return;
    }

    try {
      const progress = calculateProgress();
      const payload = {
        ...formData,
        setup_progress: progress,
      };

      if (brandId) {
        await updateBrand.mutateAsync({ id: brandId, ...payload });
        toast.success(t('fnb.brandUpdated'));
      } else {
        const newBrand = await createBrand.mutateAsync(payload);
        toast.success(t('fnb.brandCreated'));
        navigate(`/app/fnb/${newBrand.id}`);
        return;
      }
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const toggleArrayValue = (field: 'tone_of_voice' | 'content_goals' | 'preferred_formats' | 'platforms', value: string) => {
    if (field === 'tone_of_voice') {
      setFormData(prev => ({
        ...prev,
        voice: {
          ...prev.voice,
          tone_of_voice: prev.voice.tone_of_voice.includes(value)
            ? prev.voice.tone_of_voice.filter(v => v !== value)
            : [...prev.voice.tone_of_voice, value]
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [field]: (prev.preferences[field] as string[]).includes(value)
            ? (prev.preferences[field] as string[]).filter(v => v !== value)
            : [...(prev.preferences[field] as string[]), value]
        }
      }));
    }
  };

  const renderStepContent = (step: StepConfig) => {
    switch (step.id) {
      case 'basic':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>{t('fnb.brandName')} *</Label>
              <Input
                value={formData.brand_name}
                onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                placeholder={t('fnb.brandNamePlaceholder')}
              />
            </div>
            <div>
              <Label>{t('fnb.brandType')}</Label>
              <Select value={formData.brand_type} onValueChange={(v) => setFormData(prev => ({ ...prev, brand_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BRAND_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{t(`fnb.brandType.${type}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('fnb.priceLevel')}</Label>
              <Select value={formData.price_level} onValueChange={(v) => setFormData(prev => ({ ...prev, price_level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRICE_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{t(`fnb.priceLevel.${level}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('fnb.country')}</Label>
              <Select value={formData.country} onValueChange={(v) => setFormData(prev => ({ ...prev, country: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('fnb.city')}</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder={t('fnb.cityPlaceholder')}
              />
            </div>
            <div>
              <Label>{t('fnb.district')}</Label>
              <Input
                value={formData.district}
                onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                placeholder={t('fnb.districtPlaceholder')}
              />
            </div>
            <div>
              <Label>{t('fnb.defaultLanguage')}</Label>
              <Select value={formData.default_language} onValueChange={(v) => setFormData(prev => ({ ...prev, default_language: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang}>{t(`fnb.language.${lang}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>{t('fnb.shortBio')}</Label>
              <Textarea
                value={formData.brand_short_bio}
                onChange={(e) => setFormData(prev => ({ ...prev, brand_short_bio: e.target.value }))}
                placeholder={t('fnb.shortBioPlaceholder')}
                rows={2}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>{t('fnb.longBio')}</Label>
              <Textarea
                value={formData.brand_long_bio}
                onChange={(e) => setFormData(prev => ({ ...prev, brand_long_bio: e.target.value }))}
                placeholder={t('fnb.longBioPlaceholder')}
                rows={4}
              />
            </div>
          </div>
        );

      case 'visual':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>{t('fnb.primaryLogo')}</Label>
              <Input
                value={formData.visual_identity.logo_primary}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  visual_identity: { ...prev.visual_identity, logo_primary: e.target.value }
                }))}
                placeholder={t('fnb.logoUrlPlaceholder')}
              />
              <p className="text-xs text-muted-foreground mt-1">{t('fnb.logoUrlHint')}</p>
            </div>
            <div>
              <Label>{t('fnb.primaryColor')}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.visual_identity.primary_color_hex}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    visual_identity: { ...prev.visual_identity, primary_color_hex: e.target.value }
                  }))}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={formData.visual_identity.primary_color_hex}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    visual_identity: { ...prev.visual_identity, primary_color_hex: e.target.value }
                  }))}
                  placeholder="#6366f1"
                />
              </div>
            </div>
            <div>
              <Label>{t('fnb.secondaryColor')}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.visual_identity.secondary_color_hex}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    visual_identity: { ...prev.visual_identity, secondary_color_hex: e.target.value }
                  }))}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={formData.visual_identity.secondary_color_hex}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    visual_identity: { ...prev.visual_identity, secondary_color_hex: e.target.value }
                  }))}
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
            <div>
              <Label>{t('fnb.accentColor')}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.visual_identity.accent_color_hex}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    visual_identity: { ...prev.visual_identity, accent_color_hex: e.target.value }
                  }))}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={formData.visual_identity.accent_color_hex}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    visual_identity: { ...prev.visual_identity, accent_color_hex: e.target.value }
                  }))}
                  placeholder="#f59e0b"
                />
              </div>
            </div>
            <div>
              <Label>{t('fnb.primaryFont')}</Label>
              <Input
                value={formData.visual_identity.primary_font_name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  visual_identity: { ...prev.visual_identity, primary_font_name: e.target.value }
                }))}
                placeholder={t('fnb.fontPlaceholder')}
              />
            </div>
          </div>
        );

      case 'voice':
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('fnb.toneOfVoice')}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {TONE_OPTIONS.map(tone => (
                  <Badge
                    key={tone}
                    variant={formData.voice.tone_of_voice.includes(tone) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayValue('tone_of_voice', tone)}
                  >
                    {t(`fnb.tone.${tone}`)}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>{t('fnb.tagline')}</Label>
              <Input
                value={formData.voice.tagline}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  voice: { ...prev.voice, tagline: e.target.value }
                }))}
                placeholder={t('fnb.taglinePlaceholder')}
              />
            </div>
            <div>
              <Label>{t('fnb.preferredWords')}</Label>
              <Textarea
                value={formData.voice.preferred_words}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  voice: { ...prev.voice, preferred_words: e.target.value }
                }))}
                placeholder={t('fnb.preferredWordsPlaceholder')}
                rows={2}
              />
            </div>
            <div>
              <Label>{t('fnb.bannedWords')}</Label>
              <Textarea
                value={formData.voice.banned_words}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  voice: { ...prev.voice, banned_words: e.target.value }
                }))}
                placeholder={t('fnb.bannedWordsPlaceholder')}
                rows={2}
              />
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('fnb.contentGoals')}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CONTENT_GOALS.map(goal => (
                  <Badge
                    key={goal}
                    variant={formData.preferences.content_goals.includes(goal) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayValue('content_goals', goal)}
                  >
                    {t(`fnb.goal.${goal}`)}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>{t('fnb.preferredFormats')}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CONTENT_FORMATS.map(format => (
                  <Badge
                    key={format}
                    variant={formData.preferences.preferred_formats.includes(format) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayValue('preferred_formats', format)}
                  >
                    {t(`fnb.format.${format}`)}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>{t('fnb.platforms')}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PLATFORMS.map(platform => (
                  <Badge
                    key={platform}
                    variant={formData.preferences.platforms.includes(platform) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayValue('platforms', platform)}
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{t('fnb.targetPostsPerWeek')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={formData.preferences.target_posts_per_week}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    preferences: { ...prev.preferences, target_posts_per_week: parseInt(e.target.value) || 3 }
                  }))}
                />
              </div>
            </div>
          </div>
        );

      case 'social':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Instagram</Label>
              <Input
                value={formData.social_links.instagram_url}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  social_links: { ...prev.social_links, instagram_url: e.target.value }
                }))}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <Label>TikTok</Label>
              <Input
                value={formData.social_links.tiktok_url}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  social_links: { ...prev.social_links, tiktok_url: e.target.value }
                }))}
                placeholder="https://tiktok.com/@..."
              />
            </div>
            <div>
              <Label>Snapchat</Label>
              <Input
                value={formData.social_links.snapchat_url}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  social_links: { ...prev.social_links, snapchat_url: e.target.value }
                }))}
                placeholder="https://snapchat.com/..."
              />
            </div>
            <div>
              <Label>X (Twitter)</Label>
              <Input
                value={formData.social_links.x_url}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  social_links: { ...prev.social_links, x_url: e.target.value }
                }))}
                placeholder="https://x.com/..."
              />
            </div>
            <div>
              <Label>{t('fnb.website')}</Label>
              <Input
                value={formData.social_links.website_url}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  social_links: { ...prev.social_links, website_url: e.target.value }
                }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input
                value={formData.social_links.whatsapp_number}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  social_links: { ...prev.social_links, whatsapp_number: e.target.value }
                }))}
                placeholder="+966..."
              />
            </div>
          </div>
        );

      case 'owner':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t('fnb.ownerName')}</Label>
              <Input
                value={formData.account_owner.name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  account_owner: { ...prev.account_owner, name: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label>{t('fnb.ownerEmail')}</Label>
              <Input
                type="email"
                value={formData.account_owner.email}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  account_owner: { ...prev.account_owner, email: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label>{t('fnb.ownerPhone')}</Label>
              <Input
                value={formData.account_owner.phone}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  account_owner: { ...prev.account_owner, phone: e.target.value }
                }))}
                placeholder="+966..."
              />
            </div>
            <div>
              <Label>{t('fnb.preferredContact')}</Label>
              <Select 
                value={formData.account_owner.preferred_contact_method} 
                onValueChange={(v: 'whatsapp' | 'email' | 'phone_call') => setFormData(prev => ({ 
                  ...prev, 
                  account_owner: { ...prev.account_owner, preferred_contact_method: v }
                }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">{t('fnb.email')}</SelectItem>
                  <SelectItem value="phone_call">{t('fnb.phoneCall')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            {t('fnb.comingSoon')}
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/fnb')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {brandId ? t('fnb.editBrand') : t('fnb.createBrand')}
          </h1>
          <p className="text-muted-foreground">{t('fnb.setupDescription')}</p>
        </div>
        <Button onClick={handleSave} disabled={createBrand.isPending || updateBrand.isPending}>
          <Save className="h-4 w-4 me-2" />
          {t('save')}
        </Button>
      </div>

      {/* Setup Steps */}
      <div className="space-y-4">
        {SETUP_STEPS.map((step, index) => (
          <Collapsible
            key={step.id}
            open={openSteps.includes(step.id)}
            onOpenChange={() => toggleStep(step.id)}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        completedSteps.includes(step.id) 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {completedSteps.includes(step.id) ? <Check className="h-4 w-4" /> : index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-base">{t(step.titleKey)}</CardTitle>
                        <CardDescription className="text-sm">{t(step.descriptionKey)}</CardDescription>
                      </div>
                    </div>
                    {openSteps.includes(step.id) ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {renderStepContent(step)}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {/* Save Button (bottom) */}
      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={createBrand.isPending || updateBrand.isPending}>
          <Save className="h-4 w-4 me-2" />
          {brandId ? t('fnb.saveChanges') : t('fnb.createAndContinue')}
        </Button>
      </div>
    </div>
  );
}
