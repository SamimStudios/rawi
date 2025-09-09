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
import { ChevronDown, ChevronRight, ChevronUp, Edit2, Save, X, Upload, Info, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';
import { useUserCredits } from '@/hooks/useUserCredits';
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
  const { t, isRTL, language } = useLanguage();
  const { user } = useAuth();
  const { sessionId } = useGuestSession();
  const { credits } = useUserCredits();
  
  const [job, setJob] = useState<StoryboardJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobInfoOpen, setJobInfoOpen] = useState(false);
  const [movieInfoOpen, setMovieInfoOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // For movie info editing
  const [isEditingJobInfo, setIsEditingJobInfo] = useState(false);
  const [generatingMovieInfo, setGeneratingMovieInfo] = useState(false);
  const [hasMovieInfoResponse, setHasMovieInfoResponse] = useState(false);
  const [webhookFailed, setWebhookFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  // Helper function to get localized movie info based on current language
  const getLocalizedMovieInfo = (movieInfo: any, currentLanguage: 'ar' | 'en') => {
    if (currentLanguage === 'ar' && movieInfo.ar) {
      return {
        title: movieInfo.ar.title || movieInfo.title || '',
        logline: movieInfo.ar.logline || movieInfo.logline || '',
        world: movieInfo.ar.world || movieInfo.world || '',
        look: movieInfo.ar.look || movieInfo.look || ''
      };
    }
    
    return {
      title: movieInfo.title || '',
      logline: movieInfo.logline || '',
      world: movieInfo.world || '',
      look: movieInfo.look || ''
    };
  };

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
      
      // Initialize movie data from the job using localized content
      if (data.movie_info && typeof data.movie_info === 'object') {
        const localizedMovieInfo = getLocalizedMovieInfo(data.movie_info, language);
        setMovieData(localizedMovieInfo);
        setHasMovieInfoResponse(true);
      } else {
        // If no movie_info exists, we haven't received a response yet
        setHasMovieInfoResponse(false);
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
  
  // Set up realtime subscription for the storyboard_jobs table
  useEffect(() => {
    if (!jobId) return;

    const channel = supabase
      .channel('storyboard-job-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'storyboard_jobs',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          const newData = payload.new as StoryboardJob;
          setJob(newData);
          
          // Handle movie_info updates using localized content
          if (newData.movie_info && Object.keys(newData.movie_info).length > 0) {
            const localizedMovieInfo = getLocalizedMovieInfo(newData.movie_info, language);
            setMovieData(localizedMovieInfo);
            setHasMovieInfoResponse(true);
            setWebhookFailed(false);
            
            // Hide loading state if we were generating
            if (generatingMovieInfo) {
              setGeneratingMovieInfo(false);
              toast.success(t('Movie information generated successfully!'));
            }
          }
          
          // Handle webhook response
          if (newData.n8n_response) {
            const response = newData.n8n_response;
            if (response.accepted === false) {
              setGeneratingMovieInfo(false);
              setWebhookFailed(true);
              toast.error(response.error_message || t('Failed to generate movie information'));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, generatingMovieInfo, t, language]);

  // Update movie data when language changes
  useEffect(() => {
    if (job?.movie_info && typeof job.movie_info === 'object') {
      const localizedMovieInfo = getLocalizedMovieInfo(job.movie_info, language);
      setMovieData(localizedMovieInfo);
    }
  }, [language, job?.movie_info]);

  const handleGenerateMovieInfo = async () => {
    if (!jobId) return;
    
    setGeneratingMovieInfo(true);
    
    try {
      // Get the movie info generation function ID (assuming it's stored in functions table)
      const { data: functionData, error: functionError } = await supabase
        .from('functions')
        .select('id, price')
        .eq('name', 'generate-movie-info')
        .eq('active', true)
        .single();

      if (functionError || !functionData) {
        throw new Error('Movie info generation function not available');
      }

      const { data, error } = await supabase.functions.invoke('execute-function', {
        body: {
          function_id: functionData.id,
          payload: {
            table_id: 'storyboard_jobs',
            row_id: jobId
          },
          user_id: user?.id || null
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to start movie info generation');
      }
      
      if (!data?.success) {
        if (data?.error === 'Insufficient credits') {
          toast.error(`Insufficient credits. Required: ${data.required_credits || functionData.price} credits`);
          return;
        }
        throw new Error(data?.error || 'Movie info generation was rejected');
      }
      
      // Only show section after webhook success
      setMovieInfoOpen(true);
      toast.success(t('Movie info generation started...'));
      
    } catch (error) {
      console.error('Error generating movie info:', error);
      toast.error(t('Failed to generate movie information'));
      setGeneratingMovieInfo(false);
    }
  };

  // Check if job has movie_info populated (not empty object) AND we have received webhook response
  const hasMovieInfo = job?.movie_info && Object.keys(job.movie_info).length > 0 && hasMovieInfoResponse;

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
    if (!movieInfoOpen && !isEditing) return; // Can't edit if section is collapsed
    if (!hasMovieInfo) {
      toast.error(t('Movie information not available yet'));
      return;
    }

    if (isEditing) {
      // Reset data when canceling edit using localized content
      if (job?.movie_info && typeof job.movie_info === 'object') {
        const localizedMovieInfo = getLocalizedMovieInfo(job.movie_info, language);
        setMovieData(localizedMovieInfo);
      }
    }
    setIsEditing(!isEditing);
  };

  const handleEditJobInfoToggle = () => {
    if (!jobInfoOpen && !isEditingJobInfo) return; // Can't edit if section is collapsed
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

  const handleSave = async () => {
    if (!jobId) return;
    
    setIsSaving(true);
    
    try {
      // First save the movie info data
      const { error: updateError } = await supabase
        .from('storyboard_jobs')
        .update({ 
          movie_info: movieData,
          movie_info_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (updateError) {
        console.error('Error saving movie data:', updateError);
        toast.error(t('Failed to save movie information'));
        return;
      }

      // Execute the function after saving
      try {
        const { data: functionData, error: functionError } = await supabase
          .from('functions')
          .select('id, price')
          .eq('id', '17c13967-cf25-484d-87a2-16895116b408')
          .eq('active', true)
          .single();

        if (functionError || !functionData) {
          console.warn('Function not available, skipping execution');
        } else {
          // Check credits before executing
          if (credits < functionData.price) {
            toast.error(t(`Insufficient credits. Required: ${functionData.price} credits`));
            return;
          }

          const { data, error } = await supabase.functions.invoke('execute-function', {
            body: {
              function_id: functionData.id,
              payload: {
                table_id: 'storyboard_jobs',
                row_id: jobId
              },
              user_id: user?.id || null
            }
          });

          if (error) {
            console.warn('Function execution failed:', error);
            toast.error(t('Function execution failed'));
          } else if (!data?.success) {
            console.warn('Function execution not successful:', data?.error);
            toast.error(data?.error || t('Function execution was rejected'));
          } else {
            toast.success(t(`Movie information saved and processed. ${functionData.price} credits consumed.`));
          }
        }
      } catch (funcError) {
        console.warn('Error executing function:', funcError);
        // Don't fail the save operation if function execution fails
      }

      setIsEditing(false);
      fetchJob(); // Refresh job data
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast.error(t('An unexpected error occurred'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveJobInfo = async () => {
    try {
      // Convert supporting characters to JSON-serializable format matching StoryboardPlayground structure
      const processedSupportingCharacters = supportingCharacters.map(char => ({
        id: char.id,
        name: char.name,
        gender: char.gender,
        aiFace: char.aiFace,
        faceImage: char.faceImagePreview || null,
        faceImageType: char.faceImage?.type || null
      }));

      // Create the exact same structure as StoryboardPlayground sends
      const jobData = {
        ...formData,
        genres: selectedGenres,
        supportingCharacters: processedSupportingCharacters,
        faceImage: faceImagePreview,
        faceImageType: faceImage?.type || null,
        userId: user?.id || null,
        sessionId: sessionId || null
      };

      const { error } = await supabase
        .from('storyboard_jobs')
        .update({ 
          user_input: jobData,
          input_updated_at: new Date().toISOString()
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
  const isAnyEditMode = isEditingJobInfo || isEditing;
  
  // Debug logging
  console.log('Movie Info Debug:', {
    hasJobMovieInfo: job?.movie_info && Object.keys(job.movie_info).length > 0,
    hasMovieInfoResponse,
    hasMovieInfo,
    movieInfoOpen,
    isEditing,
    isAnyEditMode,
    generatingMovieInfo,
    webhookFailed,
    isSaving,
    firstGenerated
  });

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
            disabled={isAnyEditMode}
          >
            {t('Back to Dashboard')}
          </Button>
        </div>

        {/* Job Information - Collapsible and editable */}
        <Card className={cn("transition-all", isEditingJobInfo && "ring-2 ring-primary/50 bg-primary/5")}>
          <Collapsible open={jobInfoOpen} onOpenChange={(open) => !isAnyEditMode && setJobInfoOpen(open)}>
            <CollapsibleTrigger asChild>
              <CardHeader className={cn("cursor-pointer hover:bg-muted/50 transition-colors", isEditingJobInfo && "cursor-default")}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {jobInfoOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {t('initialInput')}
                    {isEditingJobInfo && (
                      <Badge variant="secondary" className="ml-2">
                        {t('Editing')}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="type_4_blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditJobInfoToggle();
                      }}
                      disabled={(!jobInfoOpen && !isEditingJobInfo) || (isAnyEditMode && !isEditingJobInfo)}
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
                        {t('Save')}
                      </Button>
                      <Button onClick={handleEditJobInfoToggle} variant="outline">
                        {t('cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Read-only view with improved design
                  <div className="space-y-6">
                    {/* Important fields - full row, bigger font, bolder */}
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{t('leadCharacter')}</div>
                        <div className="text-xl font-bold text-foreground">{formData.leadName || t('notSpecified')}</div>
                      </div>
                      
                      {formData.prompt && (
                        <div>
                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{t('prompt')}</div>
                          <div className="text-lg font-semibold text-foreground leading-relaxed">{formData.prompt}</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Regular importance fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{t('gender')}</div>
                        <div className="text-base text-foreground">{formData.leadGender ? t(formData.leadGender) : t('notSpecified')}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{t('language')}</div>
                        <div className="text-base text-foreground">{formData.language ? t(LANGUAGES.find(l => l.value === formData.language)?.key || formData.language) : t('notSpecified')}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{t('accent')}</div>
                        <div className="text-base text-foreground">{formData.accent || t('notSpecified')}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{t('aiGeneratedCharacter')}</div>
                        <div className="text-base text-foreground">{formData.leadAiCharacter ? t('yes') : t('no')}</div>
                      </div>
                    </div>
                    
                    {/* Genres section */}
                    {selectedGenres.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">{t('genres')}</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedGenres.map(genre => (
                            <Badge key={genre} variant="outline" className="text-sm">
                              {t(GENRE_OPTIONS.find(g => g.value === genre)?.key || genre)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Supporting Characters section */}
                    {supportingCharacters.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">{t('supportingCharacters')}</div>
                        <div className="space-y-2">
                          {supportingCharacters.map((char, index) => (
                            <div key={char.id} className="bg-muted/30 rounded-lg p-3 border">
                              <div className="font-medium text-foreground">{char.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {t(char.gender)} • {char.aiFace ? t('aiGenerated') : t('faceReference')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Less important info - smaller, lighter */}
                    <div className="pt-2 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        {t('Last Updated')}: {job?.updated_at ? new Date(job.updated_at).toLocaleString() : t('Not Available')}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Movie Information Section - Show generate button if no movie info and not generating */}
        {!hasMovieInfo && !generatingMovieInfo && !webhookFailed ? (
          <div className="flex flex-col items-center gap-4">
            <Button 
              size="lg"
              variant="type_1"
              className="text-lg px-8 py-4 relative"
              onClick={handleGenerateMovieInfo}
              disabled={isAnyEditMode}
            >
              {t('generateMovieInfo')}
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>{t('priceLabel')}: 0.05 {t('credits')}</span>
            </div>
          </div>
        ) : null}

        {/* Show error state if webhook failed */}
        {webhookFailed && !generatingMovieInfo && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <p className="text-destructive font-medium">{t('Movie info generation failed')}</p>
              <p className="text-sm text-muted-foreground">{t('Please try again')}</p>
            </div>
            <Button 
              size="lg"
              variant="type_1"
              className="text-lg px-8 py-4 relative"
              onClick={() => {
                setWebhookFailed(false);
                handleGenerateMovieInfo();
              }}
              disabled={isAnyEditMode}
            >
              {t('Try Again')}
            </Button>
          </div>
        )}

        {/* Loading state - show when generating and waiting for response */}
        {generatingMovieInfo && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-lg font-medium">{t('Generating movie information...')}</p>
              <p className="text-sm text-muted-foreground">{t('Please wait, this may take a moment')}</p>
            </CardContent>
          </Card>
        )}

        {/* Movie Information Section - Show when generating, has response, or has movie info */}
        {(generatingMovieInfo || hasMovieInfoResponse || hasMovieInfo) && (
          <Card className={cn("transition-all", isEditing && "ring-2 ring-primary/50 bg-primary/5")}>
            <Collapsible open={movieInfoOpen} onOpenChange={(open) => !isAnyEditMode && setMovieInfoOpen(open)}>
              <CollapsibleTrigger asChild>
                <CardHeader className={cn("cursor-pointer hover:bg-muted/50 transition-colors", isEditing && "cursor-default")}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {movieInfoOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      {t('movieInformation')}
                      {isEditing && (
                        <Badge variant="secondary" className="ml-2">
                          {t('editing')}
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="type_4_blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditToggle();
                        }}
                        disabled={(!movieInfoOpen && !isEditing) || (isAnyEditMode && !isEditing) || isSaving}
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
                        <Label htmlFor="title">{t('movieTitle')}</Label>
                        <Input
                          id="title"
                          value={movieData.title}
                          onChange={(e) => setMovieData({ ...movieData, title: e.target.value })}
                          placeholder={t('enterMovieTitle')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="logline">{t('movieLogline')}</Label>
                        <Textarea
                          id="logline"
                          value={movieData.logline}
                          onChange={(e) => setMovieData({ ...movieData, logline: e.target.value })}
                          placeholder={t('enterMovieLogline')}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="world">{t('movieWorld')}</Label>
                        <Input
                          id="world"
                          value={movieData.world}
                          onChange={(e) => setMovieData({ ...movieData, world: e.target.value })}
                          placeholder={t('enterMovieWorld')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="look">{t('movieLook')}</Label>
                        <Input
                          id="look"
                          value={movieData.look}
                          onChange={(e) => setMovieData({ ...movieData, look: e.target.value })}
                          placeholder={t('enterMovieLook')}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSave} variant="type_1" disabled={isSaving}>
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {isSaving ? t('Saving...') : t('save')}
                        </Button>
                        <Button onClick={handleEditToggle} variant="outline" disabled={isSaving}>
                          {t('cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : generatingMovieInfo && !hasMovieInfo ? (
                    // Loading state while generating
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <div className="text-center">
                        <p className="font-medium">{t('loading')}...</p>
                        <p className="text-sm text-muted-foreground">{t('pleaseWait')}</p>
                      </div>
                    </div>
                  ) : (
                    // Read-only view with improved design
                    <div className="space-y-6">
                      {/* Important fields - full row, bigger font, bolder */}
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{t('movieTitle')}</div>
                          <div className="text-xl font-bold text-foreground">{movieData.title || t('notAvailable')}</div>
                        </div>
                        
                        {movieData.logline && (
                          <div>
                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{t('movieLogline')}</div>
                            <div className="text-lg font-semibold text-foreground leading-relaxed">{movieData.logline}</div>
                          </div>
                        )}
                      </div>
                      
                      {/* Regular importance fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{t('movieWorld')}</div>
                          <div className="text-base text-foreground">{movieData.world || t('notAvailable')}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{t('movieLook')}</div>
                          <div className="text-base text-foreground">{movieData.look || t('notAvailable')}</div>
                        </div>
                      </div>
                      
                      {/* Less important info - smaller, lighter */}
                      <div className="pt-2 border-t border-border">
                        <div className="text-xs text-muted-foreground">
                          {t('lastUpdated')}: {job?.updated_at ? new Date(job.updated_at).toLocaleString() : t('notAvailable')}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Regenerate Button - Only show after first generation and movie info exists */}
        {firstGenerated && hasMovieInfo && (
          <div className="flex justify-center">
            <Button 
              size="lg"
              variant="type_1"
              className="text-lg px-8 py-4"
              onClick={handleGenerate}
              disabled={isAnyEditMode}
            >
              {t('regenerateStoryboard')}
            </Button>
          </div>
        )}

        {/* Results section will be added here later */}
      </div>
    </div>
  );
}