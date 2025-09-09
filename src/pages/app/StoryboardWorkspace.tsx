import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, ChevronUp, Edit2, Save, X, Upload } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';
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
    { key: 'accentMSA', value: 'MSA' },
    { key: 'accentGulf', value: 'Gulf' },
    { key: 'accentLevantine', value: 'Levantine' }
  ]
};

const GENRE_OPTIONS = [
  { key: 'genreAction', value: 'Action' },
  { key: 'genreAdventure', value: 'Adventure' },
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

interface StoryboardJob {
  id: string;
  user_input: any;
  movie_info: any;
  status: string;
  stage: string;
  result_data: any;
  n8n_response: any;
  created_at: string;
  updated_at: string;
}

export default function StoryboardWorkspace() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { sessionId } = useGuestSession();
  
  const [job, setJob] = useState<StoryboardJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobInfoOpen, setJobInfoOpen] = useState(false);
  const [movieInfoOpen, setMovieInfoOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingJobInfo, setIsEditingJobInfo] = useState(false);
  const [movieData, setMovieData] = useState({
    title: '',
    logline: '',
    world: '',
    look: ''
  });

  // Use exact same structure as StoryboardPlayground
  const [formData, setFormData] = useState({
    template: '',
    leadName: '',
    leadGender: '',
    leadAiCharacter: false,
    language: 'English',
    accent: 'US',
    size: '',
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
  const [templates, setTemplates] = useState<Array<{id: string, name: string, description: string}>>([]);

  // Helper function to get translated genre names
  const getTranslatedGenres = (genreValues: string[]) => {
    return genreValues.map(value => {
      const genreOption = GENRE_OPTIONS.find(g => g.value === value);
      return genreOption ? t(genreOption.key) : value;
    });
  };

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

  const handleGenreToggle = (genreValue: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreValue)) {
        return prev.filter(g => g !== genreValue);
      } else if (prev.length < 3) {
        return [...prev, genreValue];
      }
      return prev; // Don't add if already at max
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('imageUnder5MB'));
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

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('id, name, description')
          .order('name');

        if (error) {
          console.error('Error fetching templates:', error);
        } else {
          setTemplates(data || []);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    fetchTemplates();
  }, []);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('storyboard_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error fetching storyboard job:', error);
        toast.error(t('Failed to load storyboard job'));
        navigate('/app/dashboard');
        return;
      }

      setJob(data);
      
      // Initialize movie data from the job
      if (data.movie_info && typeof data.movie_info === 'object') {
        const movieInfo = data.movie_info as any;
        setMovieData({
          title: movieInfo.title || '',
          logline: movieInfo.logline || '',
          world: movieInfo.world || '',
          look: movieInfo.look || ''
        });
      }
      
      // Initialize form data from user_input using exact same structure as StoryboardPlayground
      if (data.user_input && typeof data.user_input === 'object') {
        const userInput = data.user_input as any;
        setFormData({
          template: userInput.template || '',
          leadName: userInput.leadName || '',
          leadGender: userInput.leadGender || '',
          leadAiCharacter: userInput.leadAiCharacter || false,
          language: userInput.language || 'English',
          accent: userInput.accent || 'US',
          size: userInput.size || '',
          prompt: userInput.prompt || ''
        });
        
        setSelectedGenres(userInput.genres || []);
        
        // Handle face image
        if (userInput.faceImage) {
          setFaceImagePreview(userInput.faceImage);
        }
        
        // Handle supporting characters
        setSupportingCharacters(userInput.supportingCharacters || []);
      }
      
    } catch (error) {
      console.error('Error in fetchJob:', error);
      toast.error(t('An unexpected error occurred'));
      navigate('/app/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Check if first generation has happened
  const hasFirstGeneration = (job: StoryboardJob | null): boolean => {
    if (!job) return false;
    
    return (
      (job.result_data && Object.keys(job.result_data).length > 0) ||
      (job.status !== 'pending' && job.status !== 'created') ||
      (job.stage !== 'created') ||
      (job.n8n_response && Object.keys(job.n8n_response).length > 0)
    );
  };

  const handleEditToggle = () => {
    if (!hasFirstGeneration(job)) {
      toast.error(t('Complete first generation to view/edit details'));
      return;
    }

    if (isEditing) {
      // Reset data when canceling edit
      if (job?.movie_info && typeof job.movie_info === 'object') {
        const movieInfo = job.movie_info as any;
        setMovieData({
          title: movieInfo.title || '',
          logline: movieInfo.logline || '',
          world: movieInfo.world || '',
          look: movieInfo.look || ''
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('storyboard_jobs')
        .update({ 
          movie_info: movieData,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) {
        console.error('Error saving movie data:', error);
        toast.error(t('Failed to save movie information'));
        return;
      }

      toast.success(t('Movie information saved'));
      setIsEditing(false);
      fetchJob(); // Refresh job data
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast.error(t('An unexpected error occurred'));
    }
  };

  const handleSaveJobInfo = async () => {
    try {
      // Convert supporting characters to JSON-serializable format
      const processedSupportingCharacters = supportingCharacters.map(char => ({
        ...char,
        faceImage: undefined, // Remove File object
        faceImagePreview: char.faceImagePreview // Keep the base64 string
      }));

      const jobData = {
        ...formData,
        genres: selectedGenres,
        supportingCharacters: processedSupportingCharacters,
        faceImage: faceImagePreview
      };

      const { error } = await supabase
        .from('storyboard_jobs')
        .update({ 
          user_input: jobData,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) {
        console.error('Error saving job input data:', error);
        toast.error(t('Failed to save job information'));
        return;
      }

      toast.success(t('Job information saved'));
      setIsEditingJobInfo(false);
      fetchJob(); // Refresh job data
    } catch (error) {
      console.error('Error in handleSaveJobInfo:', error);
      toast.error(t('An unexpected error occurred'));
    }
  };

  const handleEditJobInfoToggle = () => {
    if (isEditingJobInfo) {
      // Reset data when canceling edit
      if (job?.user_input && typeof job.user_input === 'object') {
        const userInput = job.user_input as any;
        setFormData({
          template: userInput.template || '',
          leadName: userInput.leadName || '',
          leadGender: userInput.leadGender || '',
          leadAiCharacter: userInput.leadAiCharacter || false,
          language: userInput.language || 'English',
          accent: userInput.accent || 'US',
          size: userInput.size || '',
          prompt: userInput.prompt || ''
        });
        
        setSelectedGenres(userInput.genres || []);
        
        if (userInput.faceImage) {
          setFaceImagePreview(userInput.faceImage);
        }
        
        setSupportingCharacters(userInput.supportingCharacters || []);
      }
    }
    setIsEditingJobInfo(!isEditingJobInfo);
  };

  const handleGenerate = () => {
    // TODO: Implement generate function - user will specify this later
    console.log('Generate storyboard');
    toast.info(t('Generate function will be implemented'));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-muted rounded mb-4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">{t('Storyboard not found')}</h1>
          <Button onClick={() => navigate('/app/dashboard')} variant="type_3_blue">
            {t('Back to Dashboard')}
          </Button>
        </div>
      </div>
    );
  }

  const firstGenerated = hasFirstGeneration(job);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('Storyboard Workspace')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('Job ID')}: {job.id.slice(0, 8)}... • {t('Status')}: <Badge variant="outline">{job.status}</Badge>
            </p>
          </div>
          <Button 
            variant="type_3_blue"
            onClick={() => navigate('/app/dashboard')}
          >
            {t('Back to Dashboard')}
          </Button>
        </div>

        {/* Generate/Regenerate Button - Dominant until first generation */}
        {!firstGenerated && (
          <div className="flex justify-center">
            <Button 
              size="lg"
              variant="type_1"
              className="text-lg px-8 py-4"
              onClick={handleGenerate}
            >
              {t('Generate Storyboard')}
            </Button>
          </div>
        )}

        {/* Job Information - Collapsible and editable */}
        <Card>
          <Collapsible open={jobInfoOpen} onOpenChange={setJobInfoOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {jobInfoOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {t('Job Information')}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="type_4_blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditJobInfoToggle();
                      }}
                    >
                      {isEditingJobInfo ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {isEditingJobInfo ? (
                  // Edit Mode - Using exact form structure from StoryboardPlayground
                  <div className="space-y-6">
                    {/* Template */}
                    <div className="space-y-2">
                      <Label htmlFor="template">{t('storyboardTemplate')} *</Label>
                      <Select value={formData.template} onValueChange={(value) => handleInputChange('template', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectTemplate')} />
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
                      <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
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
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="leadGender">{t('gender')} *</Label>
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

                      <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
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
                        <Button variant="type_3_blue" className="w-full justify-between">
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
                                    placeholder={t('enterLeadCharacterName')}
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
                                       <SelectValue placeholder={t('selectGender')} />
                                     </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="male">{t('male')}</SelectItem>
                                      <SelectItem value="female">{t('female')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
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
                                                toast.error("Please select an image under 5MB");
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
                            disabled={supportingCharacters.length >= 1}
                          >
                            {t('addSupportingCharacter')} {supportingCharacters.length >= 1 ? t('maxOneSupportingChar') : t('supportingCharCount').replace('{count}', supportingCharacters.length.toString())}
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Language */}
                    <div className="space-y-2">
                      <Label htmlFor="language">{t('voiceLanguage')} *</Label>
                      <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectLanguage')} />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>{t(lang.key)}</SelectItem>
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
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectAccent')} />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.language && ACCENTS[formData.language as keyof typeof ACCENTS]?.map(accent => (
                            <SelectItem key={accent.value} value={accent.value}>{t(accent.key)}</SelectItem>
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
                            key={genre.value}
                            variant={selectedGenres.includes(genre.value) ? "default" : "outline"}
                            className={`cursor-pointer ${
                              !selectedGenres.includes(genre.value) && selectedGenres.length >= 3 
                                ? 'opacity-50 cursor-not-allowed' 
                                : ''
                            }`}
                            onClick={() => handleGenreToggle(genre.value)}
                          >
                            {t(genre.key)}
                          </Badge>
                        ))}
                      </div>
                      {selectedGenres.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {t('selectedGenres').replace('{genres}', getTranslatedGenres(selectedGenres).join(', ')).replace('{count}', selectedGenres.length.toString())}
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

                    <div className="flex gap-2">
                      <Button onClick={handleSaveJobInfo} variant="type_1">
                        <Save className="h-4 w-4 mr-2" />
                        {t('saveJobInfo')}
                      </Button>
                      <Button onClick={handleEditJobInfoToggle} variant="outline">
                        {t('cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Read-only view
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">{t('leadCharacter')}: </span>
                        <span>{formData.leadName || t('notSpecified')}</span>
                      </div>
                      <div>
                        <span className="font-medium">{t('gender')}: </span>
                        <span>{formData.leadGender ? t(formData.leadGender) : t('notSpecified')}</span>
                      </div>
                      <div>
                        <span className="font-medium">{t('language')}: </span>
                        <span>{formData.language ? t(LANGUAGES.find(l => l.value === formData.language)?.key || formData.language) : t('notSpecified')}</span>
                      </div>
                      <div>
                        <span className="font-medium">{t('accent')}: </span>
                        <span>{formData.accent || t('notSpecified')}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium">{t('aiGeneratedCharacter')}: </span>
                        <span>{formData.leadAiCharacter ? t('yes') : t('no')}</span>
                      </div>
                    </div>
                    
                    {selectedGenres.length > 0 && (
                      <div>
                        <span className="font-medium">{t('genres')}: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedGenres.map(genre => (
                            <Badge key={genre} variant="outline" className="text-xs">
                              {t(GENRE_OPTIONS.find(g => g.value === genre)?.key || genre)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {supportingCharacters.length > 0 && (
                      <div>
                        <span className="font-medium">{t('supportingCharacters')}: </span>
                        <div className="mt-2 space-y-2">
                          {supportingCharacters.map((char, index) => (
                            <div key={char.id} className="text-sm bg-muted/50 rounded p-2">
                              <div>{char.name} ({char.gender}) - {char.aiFace ? t('aiGenerated') : t('faceReference')}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {formData.prompt && (
                      <div>
                        <span className="font-medium">{t('prompt')}: </span>
                        <p className="text-sm text-muted-foreground mt-1">{formData.prompt}</p>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      {t('lastUpdated')}: {job?.updated_at ? new Date(job.updated_at).toLocaleString() : t('notAvailable')}
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Movie Information - Only after first generation */}
        {firstGenerated && (
          <Card>
            <Collapsible open={movieInfoOpen} onOpenChange={setMovieInfoOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {movieInfoOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      {t('Movie Information')}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="type_4_blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditToggle();
                        }}
                      >
                        {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">{t('Movie Title')}</Label>
                        <Input
                          id="title"
                          value={movieData.title}
                          onChange={(e) => setMovieData({ ...movieData, title: e.target.value })}
                          placeholder={t('Enter movie title')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="logline">{t('Logline')}</Label>
                        <Textarea
                          id="logline"
                          value={movieData.logline}
                          onChange={(e) => setMovieData({ ...movieData, logline: e.target.value })}
                          placeholder={t('Enter movie logline')}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="world">{t('World')}</Label>
                        <Input
                          id="world"
                          value={movieData.world}
                          onChange={(e) => setMovieData({ ...movieData, world: e.target.value })}
                          placeholder={t('Enter movie world')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="look">{t('Look')}</Label>
                        <Input
                          id="look"
                          value={movieData.look}
                          onChange={(e) => setMovieData({ ...movieData, look: e.target.value })}
                          placeholder={t('Enter movie look')}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSave} variant="type_1">
                          <Save className="h-4 w-4 mr-2" />
                          {t('saveMovie')}
                        </Button>
                        <Button onClick={handleEditToggle} variant="outline">
                          {t('cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Read-only view
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium">{t('Movie Title')}: </span>
                        <span>{movieData.title || t('Not specified')}</span>
                      </div>
                      <div>
                        <span className="font-medium">{t('Logline')}: </span>
                        <p className="text-sm text-muted-foreground mt-1">{movieData.logline || t('Not specified')}</p>
                      </div>
                      <div>
                        <span className="font-medium">{t('World')}: </span>
                        <span>{movieData.world || t('Not specified')}</span>
                      </div>
                      <div>
                        <span className="font-medium">{t('Look')}: </span>
                        <span>{movieData.look || t('Not specified')}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Regenerate Button - Only after first generation */}
        {firstGenerated && (
          <div className="flex justify-center">
            <Button 
              variant="type_2_red"
              onClick={handleGenerate}
            >
              {t('Regenerate Storyboard')}
            </Button>
          </div>
        )}

        {/* Results section will be added here later */}
      </div>
    </div>
  );
}