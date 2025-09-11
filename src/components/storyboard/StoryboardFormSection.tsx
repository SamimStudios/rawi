import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from "@/lib/utils";
import { useStoryboardForm } from '@/hooks/useStoryboardForm';
import { LeadCharacterSection } from '@/components/storyboard/LeadCharacterSection';
import { SupportingCharacterSection } from '@/components/storyboard/SupportingCharacterSection';
import { LanguageAccentSection } from '@/components/storyboard/LanguageAccentSection';
import { GenreSelector } from '@/components/storyboard/GenreSelector';
import type { StoryboardTemplate } from '@/types/storyboard';

interface StoryboardFormSectionProps {
  initialData?: any; // Job user_input data for edit mode
  onSubmit?: (formData: any) => Promise<void>;
  onSave?: (formData: any) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  showConsentCheckbox?: boolean;
  submitButtonText?: string;
  saveButtonText?: string;
  className?: string;
}

export function StoryboardFormSection({
  initialData,
  onSubmit,
  onSave,
  isLoading = false,
  disabled = false,
  showConsentCheckbox = false,
  submitButtonText,
  saveButtonText,
  className
}: StoryboardFormSectionProps) {
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();

  // Use centralized form hook with initial data support
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
    convertToJobFormat
  } = useStoryboardForm({ initialData });

  const [supportingCollapsed, setSupportingCollapsed] = useState(true);
  const [templates, setTemplates] = useState<StoryboardTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [consentAgreed, setConsentAgreed] = useState(false);

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

  const handleFormSubmit = async (e: React.FormEvent) => {
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

    if (showConsentCheckbox && !consentAgreed) {
      toast({
        title: t('consentRequired'),
        description: t('consentRequiredDescription'),
        variant: "destructive"
      });
      return;
    }

    if (onSubmit) {
      await onSubmit(convertToJobFormat());
    }
  };

  const handleSave = async () => {
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

    if (onSave) {
      await onSave(convertToJobFormat());
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Template */}
        <div className="space-y-2">
          <Label htmlFor="template">{t('storyboardTemplate')} *</Label>
          <Select 
            onValueChange={(value) => handleInputChange('template', value)} 
            value={formData.template}
            disabled={disabled}
            required
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
            onValueChange={(value) => handleInputChange('size', value)} 
            value={formData.size}
            disabled={disabled}
            required
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
            disabled={disabled}
            rows={4}
          />
        </div>

        {/* Consent (only show if requested) */}
        {showConsentCheckbox && (
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
        <div className="flex gap-3">
          {onSave && saveButtonText && (
            <Button 
              type="button"
              variant="outline"
              onClick={handleSave}
              disabled={isLoading || disabled}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                saveButtonText
              )}
            </Button>
          )}
          
          {onSubmit && submitButtonText && (
            <Button 
              type="submit" 
              disabled={isLoading || disabled}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('creating')}
                </>
              ) : (
                submitButtonText
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}