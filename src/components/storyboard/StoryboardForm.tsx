import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import { LeadCharacterSection } from '@/components/storyboard/LeadCharacterSection';
import { SupportingCharacterSection } from '@/components/storyboard/SupportingCharacterSection';
import { LanguageAccentSection } from '@/components/storyboard/LanguageAccentSection';
import { GenreSelector } from '@/components/storyboard/GenreSelector';
import { supabase } from '@/integrations/supabase/client';
import type { StoryboardFormData, StoryboardTemplate, SupportingCharacter } from '@/types/storyboard';
import { MAX_FILE_SIZE, MAX_GENRES, MAX_SUPPORTING_CHARACTERS } from '@/lib/storyboard-constants';

interface StoryboardFormProps {
  mode: 'create' | 'edit';
  inProgressData?: any;
  onUpdate?: (data: any) => void;
  onSave: (data: any) => void;
  onCancel?: () => void;
  disabled?: boolean;
  showConsent?: boolean;
  submitLabel?: string;
  isLoading?: boolean;
}

export function StoryboardForm({
  mode,
  inProgressData = {},
  onUpdate,
  onSave,
  onCancel,
  disabled = false,
  showConsent = false,
  submitLabel,
  isLoading = false
}: StoryboardFormProps) {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();

  // Initialize with inProgress data or defaults
  const [formData, setFormData] = useState({
    template: inProgressData.template || '',
    leadName: inProgressData.leadName || user?.user_metadata?.full_name || '',
    leadGender: inProgressData.leadGender || '',
    language: inProgressData.language || 'English',
    accent: inProgressData.accent || 'US',
    size: inProgressData.size || '',
    prompt: inProgressData.prompt || ''
  });
  
  const [selectedGenres, setSelectedGenres] = useState<string[]>(inProgressData.selectedGenres || []);
  const [faceImageUrl, setFaceImageUrl] = useState<string | null>(inProgressData.faceImageUrl || null);
  const [supportingCharacters, setSupportingCharacters] = useState<SupportingCharacter[]>(inProgressData.supportingCharacters || []);
  const [isUploadingFaceImage, setIsUploadingFaceImage] = useState(false);
  const [templates, setTemplates] = useState<StoryboardTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [consentAgreed, setConsentAgreed] = useState(false);

  // UI state derived from data
  const supportingCollapsed = supportingCharacters.length === 0;

  // Real-time update to parent
  useEffect(() => {
    if (onUpdate) {
      onUpdate({
        template: formData.template,
        leadName: formData.leadName,
        leadGender: formData.leadGender,
        language: formData.language,
        accent: formData.accent,
        size: formData.size,
        prompt: formData.prompt,
        selectedGenres,
        faceImageUrl,
        supportingCharacters
      });
    }
  }, [formData, selectedGenres, faceImageUrl, supportingCharacters, onUpdate]);

  // Input handlers
  const handleInputChange = useCallback((field: keyof StoryboardFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleGenreToggle = useCallback((genreValue: string) => {
    setSelectedGenres(prev => {
      const isSelected = prev.includes(genreValue);
      if (isSelected) {
        return prev.filter(g => g !== genreValue);
      } else if (prev.length < MAX_GENRES) {
        return [...prev, genreValue];
      }
      return prev;
    });
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: t('error'),
        description: t('fileTooLarge'),
        variant: "destructive"
      });
      return;
    }

    setIsUploadingFaceImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('face-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('face-images').getPublicUrl(fileName);
      setFaceImageUrl(data.publicUrl);
      
      toast({
        title: t('success'),
        description: t('imageUploadedSuccessfully')
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToUploadImage'),
        variant: "destructive"
      });
    } finally {
      setIsUploadingFaceImage(false);
    }
  }, [toast, t]);

  const handleSupportingCharacterImageUpload = useCallback(async (characterId: string, file: File) => {
    // Handle supporting character image upload
  }, []);

  const removeImage = useCallback(() => {
    setFaceImageUrl(null);
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.template) return { isValid: false, error: t('templateRequired') };
    if (!formData.leadName) return { isValid: false, error: t('leadNameRequired') };
    if (!formData.leadGender) return { isValid: false, error: t('leadGenderRequired') };
    if (!formData.language) return { isValid: false, error: t('languageRequired') };
    if (!formData.accent) return { isValid: false, error: t('accentRequired') };
    if (!formData.size) return { isValid: false, error: t('sizeRequired') };
    if (selectedGenres.length === 0) return { isValid: false, error: t('genreRequired') };
    if (!formData.prompt) return { isValid: false, error: t('plotPromptRequired') };
    if (supportingCharacters.length > MAX_SUPPORTING_CHARACTERS) {
      return { isValid: false, error: t('tooManySupportingCharacters') };
    }
    return { isValid: true };
  }, [formData, selectedGenres, supportingCharacters, t]);

  // Load templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('id, name, description')
          .order('name');

        if (error) {
          console.error('Error fetching templates:', error);
          toast({
            title: t('warning'),
            description: t('couldNotLoadTemplates'),
            variant: "destructive"
          });
        } else {
          setTemplates(data || []);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: t('warning'),
          description: t('couldNotLoadTemplates'),
          variant: "destructive"
        });
      } finally {
        setTemplatesLoading(false);
      }
    };

    fetchTemplates();
  }, [toast, t]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.isValid) {
      toast({
        title: t('error'),
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    if (showConsent && !consentAgreed) {
      toast({
        title: t('error'),
        description: t('pleaseAgreeToConsent'),
        variant: "destructive"
      });
      return;
    }

    onSave({
      template: formData.template,
      leadName: formData.leadName,
      leadGender: formData.leadGender,
      language: formData.language,
      accent: formData.accent,
      size: formData.size,
      prompt: formData.prompt,
      selectedGenres,
      faceImageUrl,
      supportingCharacters
    });
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", isRTL && "space-x-reverse")} dir={isRTL ? "rtl" : "ltr"}>
      {/* Template Selection */}
      <div className="space-y-3">
        <Label htmlFor="template">{t('storyboardTemplate')} *</Label>
        <Select
          value={formData.template}
          onValueChange={(value) => handleInputChange('template', value)}
          disabled={templatesLoading || disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={templatesLoading ? t('loading') : t('selectTemplate')} />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                <div>
                  <div className="font-medium">{template.name}</div>
                  {template.description && (
                    <div className="text-sm text-muted-foreground">{template.description}</div>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Size Selection */}
      <div className="space-y-3">
        <Label>{t('sizeOption')} *</Label>
        <Select
          value={formData.size}
          onValueChange={(value) => handleInputChange('size', value)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectSize')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="landscape">{t('sizeLandscape')}</SelectItem>
            <SelectItem value="portrait">{t('sizePortrait')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lead Character */}
      <LeadCharacterSection
        formData={formData}
        onInputChange={handleInputChange}
        faceImageUrl={faceImageUrl}
        isUploadingFaceImage={isUploadingFaceImage}
        onImageUpload={handleImageUpload}
        onRemoveImage={removeImage}
        disabled={disabled}
      />

      {/* Supporting Characters */}
      <SupportingCharacterSection
        supportingCharacters={supportingCharacters}
        onCharactersChange={setSupportingCharacters}
        onImageUpload={handleSupportingCharacterImageUpload}
        isCollapsed={supportingCollapsed}
        onToggleCollapse={() => {}} // Derived from data, no manual toggle needed
        disabled={disabled}
      />

      {/* Language & Accent */}
      <LanguageAccentSection
        formData={formData}
        onInputChange={handleInputChange}
        disabled={disabled}
      />

      {/* Genre Selection */}
      <GenreSelector
        selectedGenres={selectedGenres}
        onGenreToggle={handleGenreToggle}
        disabled={disabled}
      />

      {/* Plot Prompt */}
      <div className="space-y-3">
        <Label htmlFor="prompt">{t('plotPrompt')} *</Label>
        <Textarea
          id="prompt"
          value={formData.prompt}
          onChange={(e) => handleInputChange('prompt', e.target.value)}
          placeholder={t('plotPromptPlaceholder')}
          rows={4}
          disabled={disabled}
        />
      </div>

      {/* Consent (if required) */}
      {showConsent && (
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Switch
            checked={consentAgreed}
            onCheckedChange={setConsentAgreed}
            disabled={disabled}
          />
          <Label htmlFor="consent" className="text-sm">
            {t('agreeToTermsAndConditions')}{" "}
            <Link to="/legal/terms" className="text-primary hover:underline">
              {t('termsAndConditions')}
            </Link>
          </Label>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={disabled || isLoading}
          >
            {t('cancel')}
          </Button>
        )}
        <Button
          type="submit"
          disabled={disabled || isLoading}
          className="flex-1"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {submitLabel || t('save')}
        </Button>
      </div>
    </form>
  );
}