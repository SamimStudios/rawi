import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { X, Upload, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { key: 'englishLang', value: 'English' }, 
  { key: 'arabicLang', value: 'Arabic' }
];

const ACCENTS = {
  'English': [
    { key: 'accentUS', value: 'US' },
    { key: 'accentUK', value: 'UK' }
  ],
  'Arabic': [
    { key: 'accentEgyptian', value: 'Egyptian' },
    { key: 'accentGulf', value: 'Gulf' },
    { key: 'accentLevantine', value: 'Levantine' }
  ]
};

const GENRE_OPTIONS = [
  { key: 'genreAction', value: 'Action' },
  { key: 'genreComedy', value: 'Comedy' },
  { key: 'genreDrama', value: 'Drama' },
  { key: 'genreFantasy', value: 'Fantasy' },
  { key: 'genreHorror', value: 'Horror' },
  { key: 'genreMystery', value: 'Mystery' },
  { key: 'genreRomance', value: 'Romance' },
  { key: 'genreSciFi', value: 'Sci-Fi' },
  { key: 'genreThriller', value: 'Thriller' },
  { key: 'genreDocumentary', value: 'Documentary' }
];

const StoryboardPlayground = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessionId } = useGuestSession();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();

  // Helper function to get translated genre names
  const getTranslatedGenres = (genreValues: string[]) => {
    return genreValues.map(value => {
      const genreOption = GENRE_OPTIONS.find(option => option.value === value);
      return genreOption ? t(genreOption.key) : value;
    });
  };

  const [formData, setFormData] = useState({
    template: '',
    leadName: '',
    leadGender: '',
    leadAiCharacter: false,
    language: '',
    accent: '',
    prompt: ''
  });

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [supportingCharacters, setSupportingCharacters] = useState<Array<{
    id: string;
    name: string;
    gender: string;
    aiFace: boolean;
    faceImage: File | null;
    faceImagePreview: string | null;
  }>>([]);
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isTemplateOpen, setIsTemplateOpen] = useState(true);
  const [isSupportingOpen, setIsSupportingOpen] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('type', 'storyboard');
          
        if (error) {
          console.error('Error fetching templates:', error);
          toast({
            title: t('error'),
            description: t('failedToLoadTemplates'),
            variant: "destructive"
          });
        } else {
          setTemplates(data || []);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        // Loading complete
      }
    };

    fetchTemplates();
  }, [toast, t]);

  useEffect(() => {
    if (user?.user_metadata?.full_name && !formData.leadName) {
      setFormData(prev => ({
        ...prev,
        leadName: user.user_metadata.full_name
      }));
    }
  }, [user, formData.leadName]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field === 'language') {
        if (value === 'Arabic') {
          updated.accent = 'Egyptian';
        } else if (value === 'English') {
          updated.accent = 'US';
        } else {
          updated.accent = '';
        }
      }

      if (field === 'leadAiCharacter') {
        if (value === 'true') {
          setFaceImage(null);
          setFaceImagePreview(null);
        }
      }

      return updated;
    });
  };

  const handleGenreToggle = (genreValue: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreValue)) {
        return prev.filter(g => g !== genreValue);
      } else if (prev.length < 3) {
        return [...prev, genreValue];
      }
      return prev;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('fileTooLarge'),
          description: t('maxFileSize5MB'),
          variant: "destructive"
        });
        return;
      }
      setFaceImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFaceImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFaceImage(null);
    setFaceImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.leadName || !formData.leadGender || !formData.language || !formData.accent || !formData.template) {
      toast({
        title: t('missingFields'),
        description: t('fillAllRequired'),
        variant: "destructive"
      });
      return;
    }

    if (selectedGenres.length === 0) {
      toast({
        title: t('missingGenres'),
        description: t('selectAtLeastOneGenre'),
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
      // Convert face image to base64 if exists
      let faceImageBase64 = null;
      if (faceImage) {
        faceImageBase64 = await convertFileToBase64(faceImage);
      }

      // Process supporting characters' face images
      const processedSupportingCharacters = await Promise.all(
        supportingCharacters.map(async (character) => ({
          ...character,
          faceImage: character.faceImage ? await convertFileToBase64(character.faceImage) : null,
          faceImageType: character.faceImage?.type || null
        }))
      );

      // Get the function details for storyboard creation
      const { data: functionData } = await supabase
        .from('functions')
        .select('*')
        .eq('name', 'start-storyboard-job')
        .eq('active', true)
        .single();

      if (!functionData) {
        toast({
          title: t('serviceUnavailable'),
          description: t('storyboardServiceUnavailable'),
          variant: "destructive"
        });
        return;
      }

      // Prepare the user input data
      const userInput = {
        ...formData,
        genres: selectedGenres,
        supportingCharacters: processedSupportingCharacters,
        faceImage: faceImageBase64,
        faceImageType: faceImage?.type || null
      };

      console.log('Creating storyboard job with user input:', userInput);

      // Create the storyboard job record
      const { data: jobData, error: jobError } = await supabase
        .from('storyboard_jobs')
        .insert({
          user_id: user?.id || null,
          session_id: sessionId || null,
          function_id: functionData.id,
          user_input: userInput,
          status: 'created',
          stage: 'created'
        })
        .select()
        .single();

      if (jobError) {
        console.error('Error creating storyboard job:', jobError);
        toast({
          title: t('errorCreatingStoryboard'),
          description: t('tryAgain'),
          variant: "destructive"
        });
        return;
      }

      console.log('Storyboard job created successfully:', jobData);
      toast({
        title: t('storyboardCreated'),
        description: t('storyboardWorkspaceCreated')
      });

      // Navigate to the storyboard workspace
      navigate(`/app/storyboard/${jobData.id}`);

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: t('error'),
        description: t('unexpectedError'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
            {/* Template Selection */}
            <Collapsible open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <Label className="text-lg font-semibold">{t('template')}</Label>
                {isTemplateOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div className="space-y-3">
                  {templates.map(template => (
                    <div key={template.id} className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all",
                      formData.template === template.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-muted-foreground"
                    )} onClick={() => handleInputChange('template', template.id)}>
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <input
                          type="radio"
                          id={template.id}
                          name="template"
                          value={template.id}
                          checked={formData.template === template.id}
                          onChange={() => handleInputChange('template', template.id)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <div>
                          <Label htmlFor={template.id} className="font-medium cursor-pointer">
                            {template.name}
                          </Label>
                          {template.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Lead Character */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">{t('leadCharacter')}</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leadName" className="text-sm font-medium">
                    {t('characterName')} *
                  </Label>
                  <Input
                    id="leadName"
                    value={formData.leadName}
                    onChange={(e) => handleInputChange('leadName', e.target.value)}
                    placeholder={t('enterCharacterName')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="leadGender" className="text-sm font-medium">
                    {t('gender')} *
                  </Label>
                  <Select value={formData.leadGender} onValueChange={(value) => handleInputChange('leadGender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectGender')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t('male')}</SelectItem>
                      <SelectItem value="female">{t('female')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch
                  id="leadAiCharacter"
                  checked={formData.leadAiCharacter}
                  onCheckedChange={(checked) => handleInputChange('leadAiCharacter', checked.toString())}
                />
                <Label htmlFor="leadAiCharacter" className="text-sm font-medium">
                  {t('useAICharacter')}
                </Label>
              </div>

              {!formData.leadAiCharacter && (
                <div>
                  <Label className="text-sm font-medium">{t('faceReference')}</Label>
                  <div className="mt-2">
                    {faceImagePreview ? (
                      <div className="relative inline-block">
                        <img 
                          src={faceImagePreview} 
                          alt="Face preview" 
                          className="w-32 h-32 rounded-lg object-cover border-2 border-border"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 border-2 border-dashed border-muted-foreground rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground text-center px-2">
                          {t('uploadImage')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Supporting Characters */}
            <Collapsible open={isSupportingOpen} onOpenChange={setIsSupportingOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <Label className="text-lg font-semibold">{t('supportingCharacters')}</Label>
                {isSupportingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div className="space-y-4">
                  {supportingCharacters.map((character, index) => (
                    <Card key={character.id} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="font-medium">{t('supportingCharacter')} {index + 1}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSupportingCharacters(prev => prev.filter(c => c.id !== character.id));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-sm font-medium">{t('characterName')}</Label>
                          <Input
                            value={character.name}
                            onChange={(e) => {
                              setSupportingCharacters(prev =>
                                prev.map(c => c.id === character.id ? { ...c, name: e.target.value } : c)
                              );
                            }}
                            placeholder={t('enterCharacterName')}
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium">{t('gender')}</Label>
                          <Select 
                            value={character.gender} 
                            onValueChange={(value) => {
                              setSupportingCharacters(prev =>
                                prev.map(c => c.id === character.id ? { ...c, gender: value } : c)
                              );
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('selectGender')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">{t('male')}</SelectItem>
                              <SelectItem value="female">{t('female')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
                        <Switch
                          id={`aiCharacter-${character.id}`}
                          checked={character.aiFace}
                          onCheckedChange={(checked) => {
                            setSupportingCharacters(prev =>
                              prev.map(c => c.id === character.id ? { 
                                ...c, 
                                aiFace: checked, 
                                faceImage: checked ? null : c.faceImage,
                                faceImagePreview: checked ? null : c.faceImagePreview
                              } : c)
                            );
                          }}
                        />
                        <Label htmlFor={`aiCharacter-${character.id}`} className="text-sm font-medium">
                          {t('useAICharacter')}
                        </Label>
                      </div>

                      {!character.aiFace && (
                        <div>
                          <Label className="text-sm font-medium">{t('faceReference')}</Label>
                          <div className="mt-2">
                            {character.faceImagePreview ? (
                              <div className="relative inline-block">
                                <img 
                                  src={character.faceImagePreview} 
                                  alt="Face preview" 
                                  className="w-32 h-32 rounded-lg object-cover border-2 border-border"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSupportingCharacters(prev =>
                                      prev.map(c => c.id === character.id ? { 
                                        ...c, 
                                        faceImage: null, 
                                        faceImagePreview: null 
                                      } : c)
                                    );
                                  }}
                                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-32 h-32 border-2 border-dashed border-muted-foreground rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 5 * 1024 * 1024) {
                                        toast({
                                          title: t('fileTooLarge'),
                                          description: t('maxFileSize5MB'),
                                          variant: "destructive"
                                        });
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onload = (e) => {
                                        setSupportingCharacters(prev =>
                                          prev.map(c => c.id === character.id ? { 
                                            ...c, 
                                            faceImage: file,
                                            faceImagePreview: e.target?.result as string
                                          } : c)
                                        );
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-xs text-muted-foreground text-center px-2">
                                  {t('uploadImage')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSupportingCharacters(prev => [...prev, {
                        id: Math.random().toString(36).substr(2, 9),
                        name: '',
                        gender: '',
                        aiFace: true,
                        faceImage: null,
                        faceImagePreview: null
                      }]);
                    }}
                    className="w-full"
                  >
                    {t('addSupportingCharacter')}
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Language & Accent */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="language" className="text-sm font-medium">
                  {t('language')} *
                </Label>
                <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {t(lang.key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="accent" className="text-sm font-medium">
                  {t('accent')} *
                </Label>
                <Select value={formData.accent} onValueChange={(value) => handleInputChange('accent', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectAccent')} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.language && ACCENTS[formData.language as keyof typeof ACCENTS]?.map(accent => (
                      <SelectItem key={accent.value} value={accent.value}>
                        {t(accent.key)}
                      </SelectItem>
                    )) || null}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Genres */}
            <div>
              <Label className="text-sm font-medium">{t('genres')} * ({t('selectUpTo3')})</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {GENRE_OPTIONS.map(genre => (
                  <Badge
                    key={genre.value}
                    variant={selectedGenres.includes(genre.value) ? "default" : "secondary"}
                    className={`cursor-pointer ${
                      selectedGenres.includes(genre.value) 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-secondary-foreground hover:text-secondary'
                    }`}
                    onClick={() => handleGenreToggle(genre.value)}
                  >
                    {t(genre.key)}
                  </Badge>
                ))}
              </div>
              {selectedGenres.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t('selectedGenres')}: {getTranslatedGenres(selectedGenres).join(', ')}
                </p>
              )}
            </div>

            {/* Plot Prompt */}
            <div>
              <Label htmlFor="prompt" className="text-sm font-medium">
                {t('plotPrompt')}
              </Label>
              <Textarea
                id="prompt"
                value={formData.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                placeholder={t('enterPlotPrompt')}
                rows={4}
                className="mt-2"
              />
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start space-x-2 rtl:space-x-reverse">
              <input
                type="checkbox"
                id="storyboard-consent"
                checked={consentAgreed}
                onChange={(e) => setConsentAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                required
              />
              <label htmlFor="storyboard-consent" className="text-sm text-muted-foreground leading-5">
                {isRTL ? (
                  <>
                    أوافق على{' '}
                    <a href="/legal/terms" className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                      الشروط والأحكام
                    </a>
                    {' '}و{' '}
                    <a href="/legal/consent" className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                      سياسة الموافقة والملكية الفكرية
                    </a>
                  </>
                ) : (
                  <>
                    I agree to the{' '}
                    <a href="/legal/terms" className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                      Terms & Conditions
                    </a>
                    {' '}and{' '}
                    <a href="/legal/consent" className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                      Consent & IP Policy
                    </a>
                  </>
                )}
              </label>
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
                  {t('creatingStoryboard')}
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
};

export default StoryboardPlayground;