import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';
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

export default function StoryboardPlayground() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessionId } = useGuestSession();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();

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
    validateForm
  } = useStoryboardForm();

  const [supportingCollapsed, setSupportingCollapsed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
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

  // Update lead name when user data becomes available
  useEffect(() => {
    if (user?.user_metadata?.full_name && !formData.leadName) {
      handleInputChange('leadName', user.user_metadata.full_name);
    }
  }, [user, formData.leadName, handleInputChange]);

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

    if (!consentAgreed) {
      toast({
        title: t('consentRequired'),
        description: t('consentRequiredDescription'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call the create-storyboard-job edge function
      const { data, error } = await supabase.functions.invoke('create-storyboard-job', {
        body: {
          leadName: formData.leadName,
          leadGender: formData.leadGender,
          language: formData.language,
          accent: formData.accent,
          genres: selectedGenres,
          prompt: formData.prompt,
          faceImageUrl: faceImageUrl,
          supportingCharacters: supportingCharacters
            .filter(char => char.name && char.gender) // Only include completed characters
            .map(char => ({
              name: char.name,
              gender: char.gender,
              aiFace: char.aiFace,
              faceImageUrl: char.faceImageUrl
            })),
          template: formData.template,
          size: formData.size,
          userId: user?.id || null,
          sessionId: sessionId || null
        }
      });

      if (error) {
        console.error('Error creating storyboard job:', error);
        toast({
          title: t('error'),
          description: error.message || t('unexpectedError'),
          variant: "destructive"
        });
        return;
      }

      toast({
        title: t('storyboardJobCreated'),
        description: t('processingRedirecting')
      });

      // Navigate to storyboard workspace
      navigate(`/app/storyboard/${data.jobId}`);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t('error'),
        description: t('unexpectedError'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">{t('storyboardPlayground')}</CardTitle>
          <p className="text-muted-foreground text-center">
            {t('createPersonalizedStoryboard')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Template */}
            <div className="space-y-2">
              <Label htmlFor="template">{t('storyboardTemplate')} *</Label>
              <Select onValueChange={(value) => handleInputChange('template', value)} required>
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
              <Label htmlFor="size">{t('sizeOption')}</Label>
              <Select onValueChange={(value) => handleInputChange('size', value)} required>
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
            />

            {/* Supporting Characters */}
            <SupportingCharacterSection
              supportingCharacters={supportingCharacters}
              onCharactersChange={setSupportingCharacters}
              onImageUpload={handleSupportingCharacterImageUpload}
              isCollapsed={supportingCollapsed}
              onToggleCollapse={() => setSupportingCollapsed(!supportingCollapsed)}
            />

            {/* Language & Accent */}
            <LanguageAccentSection
              formData={formData}
              onInputChange={handleInputChange}
            />

            {/* Genres */}
            <GenreSelector
              selectedGenres={selectedGenres}
              onGenreToggle={handleGenreToggle}
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
              />
            </div>

            {/* Consent */}
            <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
              <Switch
                id="consent"
                checked={consentAgreed}
                onCheckedChange={setConsentAgreed}
              />
              <Label htmlFor="consent" className="text-sm">
                {t('consentAgreement')}
              </Label>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('creating')}
                </>
              ) : (
                t('createStoryboard')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}