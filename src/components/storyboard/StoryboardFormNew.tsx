import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GenreSelector } from '@/components/storyboard/GenreSelector';
import { LeadCharacterSection } from '@/components/storyboard/LeadCharacterSection';
import { SupportingCharacterSection } from '@/components/storyboard/SupportingCharacterSection';
import { LanguageAccentSection } from '@/components/storyboard/LanguageAccentSection';
import { MAX_FILE_SIZE } from '@/lib/storyboard-constants';

interface StoryboardFormNewProps {
  mode: 'create' | 'edit';
  initialData?: any;
  onSave: (data: any) => Promise<void> | void;
  onCancel?: () => void;
  disabled?: boolean;
  showConsent?: boolean;
  submitLabel?: string;
  isLoading?: boolean;
}

export function StoryboardFormNew({
  mode,
  initialData = {},
  onSave,
  onCancel,
  disabled = false,
  showConsent = false,
  submitLabel,
  isLoading = false
}: StoryboardFormNewProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize form data with correct structure
  const [formData, setFormData] = useState({
    template: initialData.template || '',
    size: initialData.size || '',
    characters: {
      lead: {
        name: initialData.characters?.lead?.name || user?.user_metadata?.full_name || '',
        gender: initialData.characters?.lead?.gender || '',
        faceImage: initialData.characters?.lead?.faceImage || null
      },
      supporting: initialData.characters?.supporting || {}
    },
    language: initialData.language || 'English',
    accent: initialData.accent || 'US',
    genres: initialData.genres || [],
    prompt: initialData.prompt || ''
  });

  const [templates, setTemplates] = useState<Array<{id: string, name: string, description: string}>>([]);
  const [consentAgreed, setConsentAgreed] = useState(!showConsent);
  const [isUploadingFaceImage, setIsUploadingFaceImage] = useState(false);
  const [supportingCharacters, setSupportingCharacters] = useState<any[]>([]);

  // Convert supporting characters object to array for the component
  useEffect(() => {
    const supportingObj = formData.characters.supporting;
    const supportingArray = Object.entries(supportingObj).map(([key, character]: [string, any]) => ({
      id: key,
      ...character
    }));
    setSupportingCharacters(supportingArray);
  }, [formData.characters.supporting]);

  // Load templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data } = await supabase
          .from('templates')
          .select('id, name, description')
          .order('name');
        setTemplates(data || []);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };
    fetchTemplates();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [section, subField] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev],
          [subField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleLeadCharacterChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      characters: {
        ...prev.characters,
        lead: {
          ...prev.characters.lead,
          [field]: value
        }
      }
    }));
  };

  const handleGenreToggle = (genreValue: string) => {
    setFormData(prev => {
      const currentGenres = prev.genres;
      const isSelected = currentGenres.includes(genreValue);
      
      if (isSelected) {
        return {
          ...prev,
          genres: currentGenres.filter(g => g !== genreValue)
        };
      } else if (currentGenres.length < 3) {
        return {
          ...prev,
          genres: [...currentGenres, genreValue]
        };
      }
      return prev;
    });
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `face_ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `users/${user?.id}/face-refs/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('ai-scenes-uploads')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('ai-scenes-uploads')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const publicUrl = await uploadImageToStorage(file);
      handleLeadCharacterChange('faceImage', publicUrl);
      
      toast({
        title: t('success'),
        description: t('imageUploaded')
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('imageUploadFailed'),
        variant: "destructive"
      });
    } finally {
      setIsUploadingFaceImage(false);
    }
  };

  const handleSupportingCharacterImageUpload = async (characterId: string, file: File) => {
    try {
      const publicUrl = await uploadImageToStorage(file);
      
      setFormData(prev => ({
        ...prev,
        characters: {
          ...prev.characters,
          supporting: {
            ...prev.characters.supporting,
            [characterId]: {
              ...prev.characters.supporting[characterId],
              faceImage: publicUrl
            }
          }
        }
      }));

      toast({
        title: t('success'),
        description: t('imageUploaded')
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('imageUploadFailed'),
        variant: "destructive"
      });
    }
  };

  const handleSupportingCharactersChange = (characters: any[]) => {
    const supportingObj: any = {};
    characters.forEach(char => {
      supportingObj[char.id] = {
        name: char.name,
        gender: char.gender,
        faceImage: char.faceImageUrl || char.faceImage || null
      };
    });
    
    setFormData(prev => ({
      ...prev,
      characters: {
        ...prev.characters,
        supporting: supportingObj
      }
    }));
  };

  const removeImage = () => {
    handleLeadCharacterChange('faceImage', null);
  };

  const validateForm = () => {
    if (!formData.template) return { isValid: false, error: t('templateRequired') };
    if (!formData.size) return { isValid: false, error: t('sizeRequired') };
    if (!formData.characters.lead.name?.trim()) return { isValid: false, error: t('leadCharacterNameRequired') };
    if (!formData.characters.lead.gender) return { isValid: false, error: t('leadCharacterGenderRequired') };
    if (formData.genres.length === 0) return { isValid: false, error: t('genreRequired') };
    if (!formData.prompt?.trim()) return { isValid: false, error: t('plotPromptRequired') };
    return { isValid: true };
  };

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

    try {
      await onSave(formData);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToSave'),
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Selection */}
      <div className="space-y-2">
        <Label htmlFor="template">{t('storyboardTemplate')} *</Label>
        <Select
          value={formData.template}
          onValueChange={(value) => handleInputChange('template', value)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectTemplate')} />
          </SelectTrigger>
          <SelectContent>
            {templates.map(template => (
              <SelectItem key={template.id} value={template.id}>
                <div>
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground">{template.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Size Selection */}
      <div className="space-y-2">
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

      {/* Lead Character Section */}
      <LeadCharacterSection
        formData={{
          template: formData.template,
          leadName: formData.characters.lead.name,
          leadGender: formData.characters.lead.gender,
          language: formData.language,
          accent: formData.accent,
          size: formData.size,
          prompt: formData.prompt
        }}
        faceImageUrl={formData.characters.lead.faceImage}
        onInputChange={(field, value) => {
          if (field === 'leadName') {
            handleLeadCharacterChange('name', value);
          } else if (field === 'leadGender') {
            handleLeadCharacterChange('gender', value);
          }
        }}
        onImageUpload={handleImageUpload}
        onRemoveImage={removeImage}
        disabled={disabled}
        isUploadingFaceImage={isUploadingFaceImage}
      />

      {/* Supporting Characters */}
      <SupportingCharacterSection
        supportingCharacters={supportingCharacters}
        onCharactersChange={handleSupportingCharactersChange}
        onImageUpload={handleSupportingCharacterImageUpload}
        disabled={disabled}
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />

      {/* Language & Accent */}
      <LanguageAccentSection
        formData={{
          template: formData.template,
          leadName: formData.characters.lead.name,
          leadGender: formData.characters.lead.gender,
          language: formData.language,
          accent: formData.accent,
          size: formData.size,
          prompt: formData.prompt
        }}
        onInputChange={(field, value) => {
          if (field === 'language') {
            handleInputChange('language', value);
          } else if (field === 'accent') {
            handleInputChange('accent', value);
          }
        }}
        disabled={disabled}
      />

      {/* Genre Selection */}
      <GenreSelector
        selectedGenres={formData.genres}
        onGenreToggle={handleGenreToggle}
        disabled={disabled}
      />

      {/* Plot Prompt */}
      <div className="space-y-2">
        <Label htmlFor="prompt">{t('plotPrompt')} *</Label>
        <Textarea
          id="prompt"
          value={formData.prompt}
          onChange={(e) => handleInputChange('prompt', e.target.value)}
          placeholder={t('plotPromptPlaceholder')}
          disabled={disabled}
          rows={4}
        />
      </div>

      {/* Consent Switch */}
      {showConsent && (
        <div className="flex items-center space-x-2">
          <Switch
            id="consent"
            checked={consentAgreed}
            onCheckedChange={setConsentAgreed}
            disabled={disabled}
          />
          <Label htmlFor="consent" className="text-sm">
            {t('consentAgreement')}
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
          disabled={disabled || isLoading || (showConsent && !consentAgreed)}
        >
          {submitLabel || t('save')}
        </Button>
      </div>
    </form>
  );
}