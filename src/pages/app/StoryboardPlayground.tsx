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

const LANGUAGES = [
  'English', 'Arabic'
];

const ACCENTS = {
  'English': ['US', 'UK'],
  'Arabic': ['Egyptian', 'MSA', 'Gulf', 'Levantine']
};

const GENRE_OPTIONS = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Animation'
];

export default function StoryboardPlayground() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessionId } = useGuestSession();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    template: '',
    leadName: user?.user_metadata?.full_name || '',
    leadGender: '',
    leadAiCharacter: false,
    language: 'English',
    accent: 'American',
    prompt: ''
  });

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null);
  const [supportingCharacters, setSupportingCharacters] = useState<Array<{
    id: string;
    name: string;
    gender: string;
    aiFace: boolean;
    faceImage?: File;
    faceImagePreview?: string;
  }>>([]);
  const [supportingCollapsed, setSupportingCollapsed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<Array<{id: string, name: string, description: string}>>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

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
  }, [toast]);

  // Update lead name when user data becomes available
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
      const newData = { ...prev, [field]: value };
      // Reset accent when language changes and set default for Arabic
      if (field === 'language') {
        if (value === 'Arabic') {
          newData.accent = 'MSA'; // Default to MSA for Arabic
        } else if (value === 'English') {
          newData.accent = 'US'; // Default to US for English
        } else {
          newData.accent = '';
        }
      }
      // Handle boolean fields
      if (field === 'leadAiCharacter') {
        newData.leadAiCharacter = value === 'true';
      }
      return newData;
    });
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(genre)) {
        return prev.filter(g => g !== genre);
      } else if (prev.length < 3) {
        return [...prev, genre];
      }
      return prev; // Don't add if already at max
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('fileTooLarge'),
          description: t('imageUnder5MB'),
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

    setIsLoading(true);

    try {
      // Process supporting characters' face images
      const processedSupportingCharacters = await Promise.all(
        supportingCharacters.map(async (character) => ({
          ...character,
          faceImage: character.faceImage ? await convertFileToBase64(character.faceImage) : null,
          faceImageType: character.faceImage?.type || null
        }))
      );

      const { data, error } = await supabase.functions.invoke('create-storyboard-job', {
        body: {
          ...formData,
          genres: selectedGenres,
          supportingCharacters: processedSupportingCharacters,
          faceImage: faceImage ? await convertFileToBase64(faceImage) : null,
          faceImageType: faceImage?.type || null,
          userId: user?.id || null,
          sessionId: sessionId || null
        }
      });

      if (error) {
        console.error('Error creating storyboard job:', error);
        
        // Handle specific credit errors
        if (error.message?.includes('Insufficient credits')) {
          const requiredCredits = error.required_credits || 10;
          toast({
            title: t('insufficientCredits'),
            description: t('needCreditsMessage').replace('{credits}', requiredCredits.toString()),
            variant: "destructive",
          });
        } else {
          toast({
            title: t('error'),
            description: error.message || t('unexpectedError'),
            variant: "destructive"
          });
        }
        return;
      }

      toast({
        title: t('storyboardJobCreated'),
        description: t('processingRedirecting')
      });

      // Navigate to job status page
      navigate(`/app/storyboard-status/${data.jobId}`);

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

            {/* Lead Character */}
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="text-lg font-semibold">{t('leadCharacter')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leadName">{t('leadName')} *</Label>
                  <Input
                    id="leadName"
                    value={formData.leadName}
                    onChange={(e) => handleInputChange('leadName', e.target.value)}
                    placeholder={t('enterLeadCharacterName')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadGender">{t('gender')} *</Label>
                  <Select onValueChange={(value) => handleInputChange('leadGender', value)} required>
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="leadAiCharacter"
                  checked={formData.leadAiCharacter}
                  onCheckedChange={(checked) => handleInputChange('leadAiCharacter', checked.toString())}
                />
                <Label htmlFor="leadAiCharacter">{t('aiGeneratedCharacter')}</Label>
              </div>

              {!formData.leadAiCharacter && (
                <div className="space-y-2">
                  <Label htmlFor="faceImage">{t('faceReferenceImage')}</Label>
                  <div className="space-y-4">
                    {faceImagePreview ? (
                      <div className="relative inline-block">
                        <img 
                          src={faceImagePreview} 
                          alt={t('faceReferenceImage')} 
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">{t('uploadFaceReference')}</p>
                        <Input
                          id="faceImage"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('faceImage')?.click()}
                        >
                          {t('chooseImage')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Supporting Characters */}
            <Collapsible open={!supportingCollapsed} onOpenChange={(open) => setSupportingCollapsed(!open)}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>{t('supportingCharacters')}</span>
                  {supportingCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  {t('supportingCharactersDesc')}
                </div>
                
                <div className="space-y-4">
                  {supportingCharacters.map((character, index) => (
                    <div key={character.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{t('supportingCharacter')} {index + 1}</h4>
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('leadName')}</Label>
                          <Input
                            value={character.name}
                            onChange={(e) => {
                              setSupportingCharacters(prev => prev.map(c => 
                                c.id === character.id ? { ...c, name: e.target.value } : c
                              ));
                            }}
                            placeholder={t('figureFromPlot')}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>{t('gender')}</Label>
                          <Select 
                            value={character.gender} 
                            onValueChange={(value) => {
                              setSupportingCharacters(prev => prev.map(c => 
                                c.id === character.id ? { ...c, gender: value } : c
                              ));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('figureFromPlot')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">{t('male')}</SelectItem>
                              <SelectItem value="female">{t('female')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={character.aiFace}
                          onCheckedChange={(checked) => {
                            setSupportingCharacters(prev => prev.map(c => 
                              c.id === character.id ? { ...c, aiFace: checked } : c
                            ));
                          }}
                        />
                        <Label>{t('aiGeneratedFace')}</Label>
                      </div>

                      {!character.aiFace && (
                        <div className="space-y-2">
                          <Label>Face Reference Image</Label>
                          <div className="space-y-4">
                            {character.faceImagePreview ? (
                              <div className="relative inline-block">
                                <img 
                                  src={character.faceImagePreview} 
                                  alt="Face reference" 
                                  className="w-32 h-32 object-cover rounded-lg border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                  onClick={() => {
                                    setSupportingCharacters(prev => prev.map(c => 
                                      c.id === character.id ? { ...c, faceImage: undefined, faceImagePreview: undefined } : c
                                    ));
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground mb-2">Upload a face reference image</p>
                                <Input
                                  id={`faceImage-${character.id}`}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 5 * 1024 * 1024) {
                                        toast({
                                          title: "File too large",
                                          description: "Please select an image under 5MB",
                                          variant: "destructive"
                                        });
                                        return;
                                      }

                                      const reader = new FileReader();
                                      reader.onload = (e) => {
                                        setSupportingCharacters(prev => prev.map(c => 
                                          c.id === character.id ? { 
                                            ...c, 
                                            faceImage: file, 
                                            faceImagePreview: e.target?.result as string 
                                          } : c
                                        ));
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="hidden"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => document.getElementById(`faceImage-${character.id}`)?.click()}
                                >
                                  {t('chooseImage')}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSupportingCharacters(prev => [...prev, {
                        id: crypto.randomUUID(),
                        name: '',
                        gender: '',
                        aiFace: true
                      }]);
                    }}
                    className="w-full"
                    disabled={supportingCharacters.length >= 2}
                  >
                    {t('addSupportingCharacter')} {supportingCharacters.length >= 2 ? t('maxTwoSupportingChars') : t('supportingCharCount').replace('{count}', supportingCharacters.length.toString())}
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">{t('voiceLanguage')} *</Label>
              <Select onValueChange={(value) => handleInputChange('language', value)} defaultValue="English" required>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Accent */}
            <div className="space-y-2">
              <Label htmlFor="accent">{t('accent')} *</Label>
              <Select 
                onValueChange={(value) => handleInputChange('accent', value)} 
                value={formData.accent}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectAccent')} />
                </SelectTrigger>
                <SelectContent>
                  {formData.language && ACCENTS[formData.language as keyof typeof ACCENTS]?.map(accent => (
                    <SelectItem key={accent} value={accent}>{accent}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Genres */}
            <div className="space-y-2">
              <Label>{t('genresMax3')}</Label>
              <div className="flex flex-wrap gap-2">
                {GENRE_OPTIONS.map(genre => (
                  <Badge
                    key={genre}
                    variant={selectedGenres.includes(genre) ? "default" : "outline"}
                    className={`cursor-pointer ${
                      !selectedGenres.includes(genre) && selectedGenres.length >= 3 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}
                    onClick={() => handleGenreToggle(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
              {selectedGenres.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('selectedGenres').replace('{genres}', selectedGenres.join(', ')).replace('{count}', selectedGenres.length.toString())}
                </p>
              )}
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt">{t('plotInstructions')}</Label>
              <Textarea
                id="prompt"
                value={formData.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                placeholder={t('plotPlaceholder')}
                rows={4}
              />
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
}