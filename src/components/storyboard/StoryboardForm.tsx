import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from "@/lib/utils";
import { useStoryboardForm } from '@/hooks/useStoryboardForm';
import { LeadCharacterSection } from '@/components/storyboard/LeadCharacterSection';
import { SupportingCharacterSection } from '@/components/storyboard/SupportingCharacterSection';
import { LanguageAccentSection } from '@/components/storyboard/LanguageAccentSection';
import { GenreSelector } from '@/components/storyboard/GenreSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { StoryboardFormData, StoryboardTemplate, SupportingCharacter } from '@/types/storyboard';

interface StoryboardFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<StoryboardFormData>;
  initialGenres?: string[];
  initialSupportingCharacters?: SupportingCharacter[];
  initialFaceImage?: string | null;
  onSave: (data: {
    formData: StoryboardFormData;
    selectedGenres: string[];
    faceImageUrl: string | null;
    supportingCharacters: SupportingCharacter[];
  }) => void;
  onCancel?: () => void;
  disabled?: boolean;
  showConsent?: boolean;
  submitLabel?: string;
  isLoading?: boolean;
}

export function StoryboardForm({
  mode,
  initialData,
  initialGenres = [],
  initialSupportingCharacters = [],
  initialFaceImage = null,
  onSave,
  onCancel,
  disabled = false,
  showConsent = false,
  submitLabel,
  isLoading = false
}: StoryboardFormProps) {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();

  // Use centralized form hook
  const {
    formData,
    selectedGenres,
    faceImageUrl,
    isUploadingFaceImage,
    supportingCharacters,
    handleInputChange,
    handleGenreToggle,
    handleImageUpload,
    handleSupportingCharacterImageUpload,
    removeImage,
    setSupportingCharacters,
    validateForm,
    resetForm
  } = useStoryboardForm();

  const [supportingCollapsed, setSupportingCollapsed] = useState(true);
  const [templates, setTemplates] = useState<StoryboardTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [consentAgreed, setConsentAgreed] = useState(false);

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
      } finally {
        setTemplatesLoading(false);
      }
    };

    fetchTemplates();
  }, [toast, t]);

  // Initialize form with provided data (for edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      // Reset form first
      resetForm();
      
      // Set form data
      Object.entries(initialData).forEach(([key, value]) => {
        if (value !== undefined) {
          handleInputChange(key as keyof StoryboardFormData, value as string);
        }
      });
    }
  }, [initialData, mode, handleInputChange, resetForm]);

  // Initialize other form state for edit mode
  useEffect(() => {
    if (mode === 'edit') {
      // Set genres
      if (initialGenres.length > 0) {
        initialGenres.forEach(genre => {
          handleGenreToggle(genre);
        });
      }

      // Set supporting characters
      if (initialSupportingCharacters.length > 0) {
        setSupportingCharacters(initialSupportingCharacters);
      }

      // Set face image (this will be handled by the hook's internal state)
      // The face image URL is handled in the parent component's state management
    }
  }, [mode, initialGenres, initialSupportingCharacters, handleGenreToggle, setSupportingCharacters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use centralized validation
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: t('missingFields'),
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    if (showConsent && !consentAgreed) {
      toast({
        title: t('consentRequired'),
        description: t('consentRequiredDescription'),
        variant: "destructive"
      });
      return;
    }

    onSave({
      formData,
      selectedGenres,
      faceImageUrl: faceImageUrl || initialFaceImage,
      supportingCharacters: supportingCharacters
        .filter(char => char.name && char.gender) // Only include completed characters
        .map(char => ({
          id: char.id,
          name: char.name,
          gender: char.gender,
          faceImageUrl: char.faceImageUrl
        }))
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template */}
      <div className="space-y-2">
        <Label htmlFor="template">{t('storyboardTemplate')} *</Label>
        <Select 
          value={formData.template}
          onValueChange={(value) => handleInputChange('template', value)} 
          required
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={templatesLoading ? t('loadingTemplates') : t('selectTemplate')} />
          </SelectTrigger>
          <SelectContent className="max-w-[calc(100vw-2rem)] w-full">
            {templates.map(template => (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex flex-col max-w-full">
                  <span className="font-medium truncate">{template.name}</span>
                  {template.description && (
                    <span className="text-xs text-muted-foreground truncate">{template.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Size Option */}
      <div className="space-y-2">
        <Label htmlFor="size">{t('sizeOption')} *</Label>
        <Select 
          value={formData.size}
          onValueChange={(value) => handleInputChange('size', value)} 
          required
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectSize')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="portrait">{t('sizePortrait')}</SelectItem>
            <SelectItem value="landscape">{t('sizeLandscape')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lead Character */}
      <LeadCharacterSection
        formData={formData}
        onInputChange={handleInputChange}
        faceImageUrl={faceImageUrl || initialFaceImage}
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
        onToggleCollapse={() => setSupportingCollapsed(!supportingCollapsed)}
        disabled={disabled}
      />

      {/* Language & Accent */}
      <LanguageAccentSection
        formData={formData}
        onInputChange={handleInputChange}
        disabled={disabled}
      />

      {/* Genres */}
      <GenreSelector
        selectedGenres={selectedGenres}
        onGenreToggle={handleGenreToggle}
        disabled={disabled}
      />

      {/* Plot Prompt */}
      <div className="space-y-2">
        <Label htmlFor="prompt">{t('plotPrompt')}</Label>
        <Textarea
          id="prompt"
          value={formData.prompt}
          onChange={(e) => handleInputChange('prompt', e.target.value)}
          placeholder={t('plotPromptPlaceholder')}
          rows={4}
          disabled={disabled}
        />
      </div>

      {/* Consent (only for creation mode) */}
      {showConsent && (
        <div className={cn("flex items-start", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
          <Switch
            id="consent"
            checked={consentAgreed}
            onCheckedChange={setConsentAgreed}
            className="mt-1"
            disabled={disabled}
          />
          <Label htmlFor="consent" className="text-sm leading-relaxed">
            {t('consentAgreement')}{' '}
            <Link 
              to="/legal/terms" 
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('termsOfService')}
            </Link>
            {', '}
            <Link 
              to="/legal/privacy" 
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('privacyPolicyText')}
            </Link>
            {' '}{t('andText')}{' '}
            <Link 
              to="/legal/consent" 
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('consentIpPolicyText')}
            </Link>
          </Label>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
            disabled={disabled || isLoading}
            className="flex-1"
          >
            {t('cancel')}
          </Button>
        )}
        <Button 
          type="submit" 
          className="flex-1" 
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'edit' ? t('saving') : t('creating')}
            </>
          ) : (
            submitLabel || (mode === 'edit' ? t('saveChanges') : t('createStoryboard'))
          )}
        </Button>
      </div>
    </form>
  );
}