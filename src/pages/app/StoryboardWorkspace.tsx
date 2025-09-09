import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Edit2, 
  Save, 
  X, 
  ArrowLeft, 
  Clock, 
  User, 
  Globe, 
  Eye,
  Palette,
  Target,
  Film,
  AlertTriangle,
  Coins,
  Play,
  Music,
  Users,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useGuestSession } from '@/hooks/useGuestSession';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

// Progressive section configuration - titles will be localized using t()
const getSections = (t: any) => [
  {
    key: 'movie_info',
    title: t('movieInformation'),
    icon: Film,
    generateFunctionId: 'e9ec8814-cef4-4e3d-adf1-deaa16d47dd0', // generate-movie-info
    editFunctionId: '17c13967-cf25-484d-87a2-16895116b408', // edit-movie-info
    nextButton: t('generateCharacters'),
    fields: ['title', 'logline', 'world', 'look']
  },
  {
    key: 'characters', 
    title: t('characters'),
    icon: Users,
    generateFunctionId: null, // Will be set when function is available
    editFunctionId: null,
    nextButton: t('generateProps'),
    fields: ['lead', 'supporting']
  },
  {
    key: 'props',
    title: t('propsAndItems'),
    icon: Target,
    generateFunctionId: null,
    editFunctionId: null,
    nextButton: t('generateTimeline'),
    fields: []
  },
  {
    key: 'timeline',
    title: t('timelineAndShots'),
    icon: Play,
    generateFunctionId: null,
    editFunctionId: null,
    nextButton: t('generateMusic'),
    fields: ['clips']
  },
  {
    key: 'music',
    title: t('musicAndAudio'),
    icon: Music,
    generateFunctionId: null,
    editFunctionId: null,
    nextButton: t('completeGeneration'),
    fields: ['prefs', 'music_url']
  }
];

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
  movie_info?: any;
  characters?: any;
  props?: any;
  timeline?: any;
  music?: any;
  status: string;
  stage: string;
  result_data: any;
  n8n_response: any;
  created_at: string;
  updated_at: string;
  input_updated_at?: string;
  movie_info_updated_at?: string;
  characters_updated_at?: string;
  props_updated_at?: string;
  timeline_updated_at?: string;
  music_updated_at?: string;
}

interface FunctionData {
  id: string;
  name: string;
  price: number;
}

export default function StoryboardWorkspace() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { sessionId } = useGuestSession();
  const { credits } = useUserCredits();
  
  // Main state
  const [job, setJob] = useState<StoryboardJob | null>(null);
  const [functions, setFunctions] = useState<Record<string, FunctionData>>({});
  const [loading, setLoading] = useState(true);
  
  // Section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    input: false
  });
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});
  const [loadingSections, setLoadingSections] = useState<Record<string, boolean>>({});
  
  // Initial input state (exact same structure as StoryboardPlayground)
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
  const [templates, setTemplates] = useState<Array<{id: string, name: string, description: string}>>([]);
  
  // Section data states
  const [movieData, setMovieData] = useState({
    title: '',
    logline: '',
    world: '',
    look: ''
  });
  
  // Warning dialog state
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{ section: string; hasLaterData: boolean } | null>(null);

  console.log('🚀 StoryboardWorkspace render:', {
    jobId,
    job: job ? {
      id: job.id,
      has_movie_info: !!job.movie_info && Object.keys(job.movie_info).length > 0,
      has_characters: !!job.characters && Object.keys(job.characters).length > 0,
      has_props: !!job.props && Object.keys(job.props).length > 0,
      has_timeline: !!job.timeline && Object.keys(job.timeline).length > 0,
      has_music: !!job.music && Object.keys(job.music).length > 0,
      user_input_language: (job.user_input as any)?.language,
      timestamps: {
        input_updated_at: job.input_updated_at,
        movie_info_updated_at: job.movie_info_updated_at,
        characters_updated_at: job.characters_updated_at,
        props_updated_at: job.props_updated_at,
        timeline_updated_at: job.timeline_updated_at,
        music_updated_at: job.music_updated_at
      }
    } : null,
    functions: Object.keys(functions),
    credits,
    openSections,
    editingSections,
    loadingSections
  });

  // Helper to get user input language (not site language)
  const getUserInputLanguage = () => {
    return (job?.user_input as any)?.language || 'English';
  };

  // Helper to get localized content based on user input language
  const getLocalizedContent = (data: any, userLanguage: string) => {
    if (!data) return {};
    
    const isArabic = userLanguage === 'Arabic';
    if (isArabic && data.ar) {
      return data.ar;
    }
    return data;
  };

  // Helper to get localized display value
  const getLocalizedValue = (data: any, field: string, defaultValue: string = '') => {
    const userLanguage = getUserInputLanguage();
    const localizedData = getLocalizedContent(data, userLanguage);
    return localizedData[field] || defaultValue;
  };

  // Progressive section visibility logic
  const getSectionVisibility = () => {
    if (!job) return { visibleSections: ['input'], nextSection: null };
    
    const visibleSections = ['input'];
    let nextSection = null;
    
    // Check each section progressively
    if (job.movie_info && Object.keys(job.movie_info).length > 0) {
      visibleSections.push('movie_info');
      
      if (job.characters && Object.keys(job.characters).length > 0) {
        visibleSections.push('characters');
        
        if (job.props && Object.keys(job.props).length > 0) {
          visibleSections.push('props');
          
          if (job.timeline && Object.keys(job.timeline).length > 0) {
            visibleSections.push('timeline');
            
            if (job.music && Object.keys(job.music).length > 0) {
              visibleSections.push('music');
            } else {
              nextSection = 'music';
            }
          } else {
            nextSection = 'timeline';
          }
        } else {
          nextSection = 'props';
        }
      } else {
        nextSection = 'characters';
      }
    } else {
      nextSection = 'movie_info';
    }
    
    return { visibleSections, nextSection };
  };

  // Check if editing a section would affect later sections
  const checkEditImpact = (sectionKey: string) => {
    if (!job) return false;
    
    const sectionIndex = SECTIONS.findIndex(s => s.key === sectionKey);
    if (sectionIndex === -1) return false;
    
    // Check if any later sections have data
    for (let i = sectionIndex + 1; i < SECTIONS.length; i++) {
      const laterSection = SECTIONS[i];
      const laterData = job[laterSection.key as keyof StoryboardJob];
      if (laterData && typeof laterData === 'object' && Object.keys(laterData).length > 0) {
        return true;
      }
    }
    
    return false;
  };

  // Fetch functions from database
  const fetchFunctions = async () => {
    try {
      console.log('🔍 Fetching functions from database...');
      const { data, error } = await supabase
        .from('functions')
        .select('id, name, price')
        .eq('active', true);

      if (error) throw error;

      const functionsMap: Record<string, FunctionData> = {};
      data.forEach(func => {
        functionsMap[func.name] = func;
      });

      console.log('📡 Functions fetched:', functionsMap);
      setFunctions(functionsMap);
    } catch (error) {
      console.error('❌ Error fetching functions:', error);
      toast({
        title: "Error",
        description: "Failed to load function information",
        variant: "destructive"
      });
    }
  };

  // Fetch job data
  const fetchJob = async () => {
    if (!jobId) return;
    
    console.log('🔄 fetchJob called for jobId:', jobId);
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('storyboard_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      console.log('📡 Supabase fetchJob response:', { data, error });

      if (error) {
        console.error('❌ Error fetching storyboard job:', error);
        toast({
          title: "Error",
          description: "Failed to load storyboard job",
          variant: "destructive"
        });
        navigate('/app/dashboard');
        return;
      }

      console.log('✅ Job data fetched successfully:', data);
      setJob(data);
      
      // Initialize form data from user_input
      if (data.user_input && typeof data.user_input === 'object') {
        const userInput = data.user_input as any;
        console.log('📝 Initializing form data from user_input:', userInput);
        
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
      
      // Initialize movie data using user input language
      if (data.movie_info && typeof data.movie_info === 'object') {
        const userLanguage = getUserInputLanguage();
        const localizedMovieInfo = getLocalizedContent(data.movie_info, userLanguage);
        console.log('🎬 Setting movie data:', localizedMovieInfo);
        setMovieData({
          title: localizedMovieInfo.title || '',
          logline: localizedMovieInfo.logline || '',
          world: localizedMovieInfo.world || '',
          look: localizedMovieInfo.look || ''
        });
      }
      
    } catch (error) {
      console.error('❌ Error in fetchJob:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      navigate('/app/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Fetch templates
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

  // Execute function via execute-function edge function
  const executeFunction = async (functionName: string, payload: any) => {
    console.log(`🎯 Executing function: ${functionName}`, { payload });
    
    const functionData = functions[functionName];
    if (!functionData) {
      throw new Error(`Function ${functionName} not found`);
    }

    console.log('💰 Function details:', functionData, '| User credits:', credits);

    const { data, error } = await supabase.functions.invoke('execute-function', {
      body: {
        function_id: functionData.id,
        payload: {
          table_id: 'storyboard_jobs',
          row_id: jobId,
          ...payload
        },
        user_id: user?.id || null
      }
    });

    console.log('📡 Execute-function response:', { data, error });

    if (error) {
      throw new Error(error.message || `Failed to execute ${functionName}`);
    }
    
    if (!data?.success) {
      if (data?.error === 'Insufficient credits') {
        throw new Error(`Insufficient credits. Required: ${data.required_credits || functionData.price} credits`);
      }
      throw new Error(data?.error || `${functionName} execution was rejected`);
    }
    
    return data;
  };

  // Generate section handler
  const handleGenerate = async (sectionKey: string) => {
    const section = SECTIONS.find(s => s.key === sectionKey);
    if (!section) return;

    console.log(`🚀 Generating section: ${sectionKey}`);
    
    setLoadingSections(prev => ({ ...prev, [sectionKey]: true }));
    
    try {
      await executeFunction('generate-movie-info', {});
      
      // Open the section after successful generation
      setOpenSections(prev => ({ ...prev, [sectionKey]: true }));
      
      toast({
        title: "Success",
        description: `${section.title} generation started...`,
      });
      
    } catch (error) {
      console.error(`❌ Error generating ${sectionKey}:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to generate ${section.title}`,
        variant: "destructive"
      });
    } finally {
      setLoadingSections(prev => ({ ...prev, [sectionKey]: false }));
    }
  };

  // Edit toggle with warning system
  const handleEditToggle = (sectionKey: string) => {
    const isCurrentlyEditing = editingSections[sectionKey];
    
    if (isCurrentlyEditing) {
      // Cancel editing - reset data
      if (sectionKey === 'input') {
        // Reset input data
        if (job?.user_input) {
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
      } else if (sectionKey === 'movie_info') {
        // Reset movie data using user input language
        if (job?.movie_info) {
          const userLanguage = getUserInputLanguage();
          const localizedMovieInfo = getLocalizedContent(job.movie_info, userLanguage);
          setMovieData({
            title: localizedMovieInfo.title || '',
            logline: localizedMovieInfo.logline || '',
            world: localizedMovieInfo.world || '',
            look: localizedMovieInfo.look || ''
          });
        }
      }
      
      setEditingSections(prev => ({ ...prev, [sectionKey]: false }));
      return;
    }

    // Starting to edit - check for impact
    const hasLaterData = checkEditImpact(sectionKey);
    
    if (hasLaterData) {
      setPendingEdit({ section: sectionKey, hasLaterData });
      setShowEditWarning(true);
    } else {
      setEditingSections(prev => ({ ...prev, [sectionKey]: true }));
    }
  };

  // Handle warning dialog actions
  const handleEditWarningAction = (action: 'discard' | 'delete' | 'override') => {
    if (!pendingEdit) return;
    
    const { section } = pendingEdit;
    
    if (action === 'discard') {
      // Just close dialog, don't start editing
      setShowEditWarning(false);
      setPendingEdit(null);
    } else if (action === 'delete') {
      // TODO: Implement deletion of progressive data
      console.log('TODO: Delete progressive data after', section);
      setEditingSections(prev => ({ ...prev, [section]: true }));
      setShowEditWarning(false);
      setPendingEdit(null);
    } else if (action === 'override') {
      // Start editing with warning acknowledged
      setEditingSections(prev => ({ ...prev, [section]: true }));
      setShowEditWarning(false);
      setPendingEdit(null);
    }
  };

  // Save handlers
  const handleSaveInput = async () => {
    console.log('💾 Saving input data...');
    
    try {
      const processedSupportingCharacters = supportingCharacters.map(char => ({
        id: char.id,
        name: char.name,
        gender: char.gender,
        aiFace: char.aiFace,
        faceImage: char.faceImagePreview || null,
        faceImageType: char.faceImage?.type || null
      }));

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

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job information saved successfully",
      });
      
      setEditingSections(prev => ({ ...prev, input: false }));
      fetchJob(); // Refresh data
      
    } catch (error) {
      console.error('❌ Error saving input:', error);
      toast({
        title: "Error",
        description: "Failed to save job information",
        variant: "destructive"
      });
    }
  };

  const handleSaveMovieInfo = async () => {
    console.log('💾 Saving movie info...');
    
    try {
      const editFunction = functions['edit-movie-info'];
      
      // If edit function is available and user has credits, use it instead of direct DB save
      if (editFunction && credits >= editFunction.price) {
        console.log('🎯 Using edit function instead of direct save');
        await executeFunction('edit-movie-info', { edits: movieData });
        toast({
          title: "Success",
          description: `Movie information processed and saved. ${editFunction.price} credits consumed.`,
        });
      } else {
        // No function available or insufficient credits - save directly to DB
        console.log('💾 Saving directly to database');
        const { error: updateError } = await supabase
          .from('storyboard_jobs')
          .update({ 
            movie_info: movieData,
            movie_info_updated_at: new Date().toISOString()
          })
          .eq('id', jobId);

        if (updateError) throw updateError;

        toast({
          title: "Success",
          description: "Movie information saved",
        });
      }

      setEditingSections(prev => ({ ...prev, movie_info: false }));
      fetchJob(); // Refresh data
      
    } catch (error) {
      console.error('❌ Error saving movie info:', error);
      toast({
        title: "Error",
        description: "Failed to save movie information",
        variant: "destructive"
      });
    }
  };

  // Input change handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'language') {
        if (value === 'Arabic') {
          newData.accent = 'MSA';
        } else if (value === 'English') {
          newData.accent = 'US';
        } else {
          newData.accent = '';
        }
      }
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
      return prev;
    });
  };

  // Set up real-time subscriptions
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
          console.log('🔔 Realtime update received:', payload);
          const newData = payload.new as StoryboardJob;
          setJob(newData);
          
          // Update section data if new data arrives
          if (newData.movie_info && Object.keys(newData.movie_info).length > 0) {
            const userLanguage = getUserInputLanguage();
            const localizedMovieInfo = getLocalizedContent(newData.movie_info, userLanguage);
            setMovieData({
              title: localizedMovieInfo.title || '',
              logline: localizedMovieInfo.logline || '',
              world: localizedMovieInfo.world || '',
              look: localizedMovieInfo.look || ''
            });
            
            // Stop loading if we were waiting for this section
            setLoadingSections(prev => ({ ...prev, movie_info: false }));
          }
          
          // Handle other sections similarly
          Object.keys(loadingSections).forEach(sectionKey => {
            if (loadingSections[sectionKey] && newData[sectionKey as keyof StoryboardJob]) {
              setLoadingSections(prev => ({ ...prev, [sectionKey]: false }));
              toast({
                title: "Success",
                description: `${SECTIONS.find(s => s.key === sectionKey)?.title} generated successfully!`,
              });
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, loadingSections]);

  // Initialize data on mount
  useEffect(() => {
    fetchFunctions();
    fetchTemplates();
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">{t('storyboardNotFound')}</h1>
          <Button onClick={() => navigate('/app/dashboard')} variant="default">
            {t('backToDashboard')}
          </Button>
        </div>
      </div>
    );
  }

  const { visibleSections, nextSection } = getSectionVisibility();
  const isAnyEditMode = Object.values(editingSections).some(Boolean);
  const userLanguage = getUserInputLanguage();
  const SECTIONS = getSections(t);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('storyboardWorkspace')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('jobId')}: {job.id.slice(0, 8)}... • {t('status')}: <Badge variant="outline">{job.status}</Badge> • {t('credits')}: <span className="font-medium text-primary">{credits}</span>
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={() => navigate('/app/dashboard')}
            disabled={isAnyEditMode}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToDashboard')}
          </Button>
        </div>

        {/* Initial Input Section */}
        <Card className={cn("transition-all", editingSections.input && "ring-2 ring-primary/50")}>
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => !isAnyEditMode && setOpenSections(prev => ({ ...prev, input: !prev.input }))}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('initialInput')}
                {editingSections.input && <Badge variant="secondary">{t('editing')}</Badge>}
              </CardTitle>
              <div className="flex items-center gap-2">
                {job.input_updated_at ? (
                  <div className="text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(job.input_updated_at).toLocaleString()}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {t('lastUpdated')}: {t('notAvailable')}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditToggle('input');
                  }}
                  disabled={isAnyEditMode && !editingSections.input}
                >
                  {editingSections.input ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {openSections.input && (
            <CardContent className="space-y-4">
              {editingSections.input ? (
                <div className="space-y-4">
                  {/* Template */}
                  <div>
                    <label className="text-sm font-medium">{t('storyboardTemplate')} *</label>
                    <Select value={formData.template} onValueChange={(value) => handleInputChange('template', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectTemplate')} />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="text-sm font-medium">{t('sizeOption')} *</label>
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('leadCharacter')}</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="text-sm font-medium">{t('leadName')} *</label>
                         <Input
                           value={formData.leadName}
                           onChange={(e) => handleInputChange('leadName', e.target.value)}
                           placeholder={t('enterLeadCharacterName')}
                         />
                       </div>
                       <div>
                         <label className="text-sm font-medium">{t('gender')} *</label>
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
                  </div>
                  
                  {/* Language & Accent */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">{t('language')} *</label>
                      <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>{t(lang.key)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('accent')} *</label>
                      <Select value={formData.accent} onValueChange={(value) => handleInputChange('accent', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(ACCENTS[formData.language] || []).map(accent => (
                            <SelectItem key={accent.value} value={accent.value}>{t(accent.key)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Genres */}
                  <div>
                    <label className="text-sm font-medium">{t('genres')} ({selectedGenres.length}/3)</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {GENRE_OPTIONS.map(genre => (
                        <Badge
                          key={genre.value}
                          variant={selectedGenres.includes(genre.value) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleGenreToggle(genre.value)}
                        >
                          {t(genre.key)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">{t('storyPrompt')}</label>
                    <Textarea
                      value={formData.prompt}
                      onChange={(e) => handleInputChange('prompt', e.target.value)}
                      placeholder={t('describeYourStory')}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <Button onClick={handleSaveInput} variant="default" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {t('save')}
                    </Button>
                    <Button onClick={() => handleEditToggle('input')} variant="outline">
                      {t('cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Template */}
                  <div>
                    <div className="text-sm font-medium text-primary">{t('storyboardTemplate')}</div>
                    <div className="text-lg">
                      {templates.find(t => t.id === formData.template)?.name || formData.template || t('notSpecified')}
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <div className="text-sm font-medium text-primary">{t('sizeOption')}</div>
                    <div className="text-lg">
                      {formData.size === 'portrait' ? t('sizePortrait') : formData.size === 'landscape' ? t('sizeLandscape') : t('notSpecified')}
                    </div>
                  </div>

                  {/* Lead Character */}
                  <div>
                    <div className="text-sm font-medium text-primary">{t('leadCharacter')}</div>
                    <div className="text-lg font-semibold">
                      {formData.leadName || t('notSpecified')} 
                      {formData.leadGender && ` (${formData.leadGender === 'male' ? t('male') : t('female')})`}
                    </div>
                    {formData.leadAiCharacter && (
                      <Badge variant="secondary" className="mt-1">{t('aiGeneratedCharacter')}</Badge>
                    )}
                    {faceImagePreview && !formData.leadAiCharacter && (
                      <img src={faceImagePreview} alt={t('faceReferenceImage')} className="w-16 h-16 rounded object-cover mt-2" />
                    )}
                  </div>

                  {/* Supporting Characters */}
                  {supportingCharacters.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-primary">{t('supportingCharacters')}</div>
                      <div className="space-y-2 mt-1">
                        {supportingCharacters.map((character, index) => (
                          <div key={character.id} className="flex items-center gap-3 p-2 border rounded">
                            {character.faceImagePreview && !character.aiFace && (
                              <img src={character.faceImagePreview} alt={character.name} className="w-8 h-8 rounded object-cover" />
                            )}
                            <div className="flex-1">
                              <div className="font-medium">{character.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {character.gender === 'male' ? t('male') : t('female')}
                                {character.aiFace && ` • ${t('aiGeneratedCharacter')}`}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Language & Accent */}
                  <div>
                    <div className="text-sm font-medium text-primary">{t('language')} & {t('accent')}</div>
                    <div className="text-lg">{formData.language} ({formData.accent})</div>
                  </div>

                  {/* Genres */}
                  <div>
                    <div className="text-sm font-medium text-primary">{t('genres')}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedGenres.map(genre => {
                        const genreOption = GENRE_OPTIONS.find(g => g.value === genre);
                        return (
                          <Badge key={genre} variant="secondary">
                            {genreOption ? t(genreOption.key) : genre}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Prompt */}
                  {formData.prompt && (
                    <div>
                      <div className="text-sm font-medium text-primary">{t('storyPrompt')}</div>
                      <div className="text-sm bg-muted p-3 rounded">{formData.prompt}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Progressive Sections */}
        {SECTIONS.map((section, index) => {
          const isVisible = visibleSections.includes(section.key);
          const isNext = nextSection === section.key;
          const sectionData = job[section.key as keyof StoryboardJob];
          const hasData = sectionData && typeof sectionData === 'object' && Object.keys(sectionData).length > 0;
          const isLoading = loadingSections[section.key];
          const isEditing = editingSections[section.key];
          const updatedAtKey = `${section.key}_updated_at` as keyof StoryboardJob;
          const lastUpdated = job[updatedAtKey] as string;
          
          if (!isVisible && !isNext) return null;

          // Generate button for next section
          if (isNext && !hasData && !isLoading) {
            const functionData = functions['generate-movie-info'];
            return (
              <div key={section.key} className="flex flex-col items-center gap-4">
                <Button 
                  size="lg"
                  variant="default"
                  className="text-lg px-8 py-4"
                  onClick={() => handleGenerate(section.key)}
                  disabled={isAnyEditMode}
                >
                  <section.icon className="h-5 w-5 mr-2" />
                  {t('generate')} {section.title}
                </Button>
                {functionData && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Coins className="h-3 w-3" />
                    <span>{t('cost')}: {functionData.price} {t('credits')} • {t('balance')}: {credits} {t('credits')}</span>
                  </div>
                )}
              </div>
            );
          }

          // Loading state
          if (isLoading) {
            return (
              <Card key={section.key}>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p className="text-lg font-medium">{t('generating')} {section.title}...</p>
                  <p className="text-sm text-muted-foreground">{t('pleaseWaitMoment')}</p>
                </CardContent>
              </Card>
            );
          }

          // Section with data
          if (hasData) {
            return (
              <Card key={section.key} className={cn("transition-all", isEditing && "ring-2 ring-primary/50")}>
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => !isAnyEditMode && setOpenSections(prev => ({ ...prev, [section.key]: !prev[section.key] }))}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <section.icon className="h-5 w-5" />
                      {section.title}
                      {isEditing && <Badge variant="secondary">{t('editing')}</Badge>}
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {lastUpdated && (
                        <div className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(lastUpdated).toLocaleString()}
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditToggle(section.key);
                        }}
                        disabled={isAnyEditMode && !isEditing}
                      >
                        {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {openSections[section.key] && (
                  <CardContent>
                    {section.key === 'movie_info' && isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">{t('title')}</label>
                          <Input
                            value={movieData.title}
                            onChange={(e) => setMovieData({ ...movieData, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">{t('logline')}</label>
                          <Textarea
                            value={movieData.logline}
                            onChange={(e) => setMovieData({ ...movieData, logline: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">{t('world')}</label>
                          <Input
                            value={movieData.world}
                            onChange={(e) => setMovieData({ ...movieData, world: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">{t('look')}</label>
                          <Input
                            value={movieData.look}
                            onChange={(e) => setMovieData({ ...movieData, look: e.target.value })}
                          />
                        </div>
                        <div className="flex gap-2 items-center">
                          <Button onClick={handleSaveMovieInfo} variant="default" className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {t('save')}
                            {functions['edit-movie-info'] && (
                              <span className="text-xs opacity-75">
                                ({functions['edit-movie-info'].price} {t('credits')})
                              </span>
                            )}
                          </Button>
                          <Button onClick={() => handleEditToggle('movie_info')} variant="outline">
                            {t('cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {section.key === 'movie_info' ? (
                          <>
                            <div>
                              <div className="text-sm font-medium text-primary">{t('title')}</div>
                              <div className="text-lg font-semibold">{getLocalizedValue(job.movie_info, 'title', t('notAvailable'))}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-primary">{t('logline')}</div>
                              <div>{getLocalizedValue(job.movie_info, 'logline', t('notAvailable'))}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm font-medium text-primary">{t('world')}</div>
                                <div>{getLocalizedValue(job.movie_info, 'world', t('notAvailable'))}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-primary">{t('look')}</div>
                                <div>{getLocalizedValue(job.movie_info, 'look', t('notAvailable'))}</div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-muted-foreground">
                            {section.title} {t('contentWillBeDisplayedHere')}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          }

          return null;
        })}

        {/* Edit Warning Dialog */}
        <AlertDialog open={showEditWarning} onOpenChange={setShowEditWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                {t('warningEditImpact')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('editingSectionMayAffect')}
                
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {t('whatWouldYouLikeToDo')}
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={() => handleEditWarningAction('discard')}>
                {t('discardChanges')}
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => handleEditWarningAction('delete')}
                className="bg-red-600 hover:bg-red-700"
              >
                {t('editAndDeleteProgressiveData')}
              </AlertDialogAction>
              <AlertDialogAction onClick={() => handleEditWarningAction('override')}>
                {t('overrideMyResponsibility')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
