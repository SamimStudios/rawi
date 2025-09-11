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
  CheckCircle,
  RefreshCw,
  Trash2,
  Package
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useGuestSession } from '@/hooks/useGuestSession';
import { SystemAlertDialog, SystemAlertAction } from '@/components/ui/system-alert-dialog';
import { cn } from '@/lib/utils';
import { SupportingCharacterSection } from '@/components/storyboard/SupportingCharacterSection';

// Progressive section configuration - titles will be localized using t()
const getSections = (t: any) => [
  {
    key: 'movie_info',
    title: t('movieInformation'),
    icon: Film,
    generateFunctionId: 'generate-movie-info', // Use function name
    editFunctionId: 'edit-movie-info', // Use function name
    nextButton: t('generateCharacters'),
    fields: ['title', 'logline', 'world', 'look']
  },
  {
    key: 'characters', 
    title: t('characters'),
    icon: Users,
    generateFunctionId: 'generate-character-description', // Use function name for character generation
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
  
  // Safe auth usage with fallback
  let user = null;
  try {
    const authHook = useAuth();
    user = authHook.user;
  } catch (error) {
    console.warn('Auth context not available:', error);
    user = null;
  }
  
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
  const [isUploadingFaceImage, setIsUploadingFaceImage] = useState(false);
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
    look: '',
    characters: {
      lead: {
        name: '',
        gender: ''
      },
      supporting: {
        name: '',
        gender: ''
      }
    }
  });

  // Character states
  const [characterData, setCharacterData] = useState<any>(null);
  const [characterEditData, setCharacterEditData] = useState<any>({});
  const [isGeneratingCharacters, setIsGeneratingCharacters] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState<{[key: string]: boolean}>({});
  const [isValidatingDescription, setIsValidatingDescription] = useState<{[key: string]: boolean}>({});
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState<{[key: string]: boolean}>({});
  
  // Validation states
  const [validationStatus, setValidationStatus] = useState<'validating' | 'valid' | 'invalid' | null>(null);
  const [validationReason, setValidationReason] = useState<{ ar?: string; en?: string } | null>(null);
  const [suggestedFix, setSuggestedFix] = useState<{ 
    movie_title?: string; 
    logline?: string; 
    world?: string; 
    look?: string;
    characters?: {
      lead?: { name: string; gender: string; };
      supporting?: { name: string; gender: string; };
    };
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // Warning dialog state
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [showRegenerateWarning, setShowRegenerateWarning] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ section: string; affectedSections: string[] } | null>(null);
  const [pendingEdit, setPendingEdit] = useState<{ section: string; hasLaterData: boolean; affectedSections: string[] } | null>(null);
  
  // Enhanced edit impact state
  const [affectedSections, setAffectedSections] = useState<string[]>([]);
  const [overrideMode, setOverrideMode] = useState(false);
  const [sectionWarnings, setSectionWarnings] = useState<Record<string, boolean>>({});

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

  // Helper to get gender options based on user input language
  const getGenderOptions = () => {
    const language = getUserInputLanguage();
    if (language === 'Arabic') {
      return [
        { value: 'ذكر', label: 'ذكر' },
        { value: 'أنثى', label: 'أنثى' }
      ];
    } else {
      return [
        { value: 'male', label: 'male' },
        { value: 'female', label: 'female' }
      ];
    }
  };

  // Helper to get movie info values directly (no language nesting)
  const getMovieInfoValue = (data: any, field: string, defaultValue: string = '') => {
    if (!data) return defaultValue;
    return data[field] || defaultValue;
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const fileExtension = file.type.split('/')[1] || 'jpg';
    const fileName = `face_ref_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
    
    // Create folder structure based on user/session
    const folder = user?.id ? `users/${user.id}/face-refs` : `guests/${sessionId}/face-refs`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('ai-scenes-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload image');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ai-scenes-uploads')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingFaceImage(true);
    
    try {
      const imageUrl = await uploadImageToStorage(file);
      setFaceImagePreview(imageUrl);
      setFaceImage(file);
      
      toast({
        title: t('imageUploaded'),
        description: t('imageUploadedSuccessfully')
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: t('imageUploadFailed'),
        variant: "destructive"
      });
    } finally {
      setIsUploadingFaceImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFaceImage(null);
    setFaceImagePreview(null);
  };

  const handleSupportingCharacterImageUpload = async (characterId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive"
      });
      return;
    }

    // Set uploading state for this character
    setSupportingCharacters(prev => prev.map(char => 
      char.id === characterId ? { ...char, isUploading: true } : char
    ));

    try {
      const imageUrl = await uploadImageToStorage(file);
      
      setSupportingCharacters(prev => prev.map(char => 
        char.id === characterId 
          ? { ...char, faceImagePreview: imageUrl, faceImage: file, isUploading: false }
          : char
      ));
      
      toast({
        title: t('imageUploaded'),
        description: t('imageUploadedSuccessfully')
      });
    } catch (error) {
      console.error('Error uploading character image:', error);
      setSupportingCharacters(prev => prev.map(char => 
        char.id === characterId ? { ...char, isUploading: false } : char
      ));
      toast({
        title: "Error",
        description: t('imageUploadFailed'),
        variant: "destructive"
      });
    }
  };

  // Direct file upload function for SupportingCharacterSection component
  const uploadSupportingCharacterImageDirect = async (characterId: string, file: File) => {
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive"
      });
      return;
    }

    // Set uploading state for this character
    setSupportingCharacters(prev => prev.map(char => 
      char.id === characterId ? { ...char, isUploading: true } : char
    ));

    try {
      const imageUrl = await uploadImageToStorage(file);
      
      setSupportingCharacters(prev => prev.map(char => 
        char.id === characterId 
          ? { ...char, faceImagePreview: imageUrl, faceImage: file, isUploading: false }
          : char
      ));
      
      toast({
        title: t('imageUploaded'),
        description: t('imageUploadedSuccessfully')
      });
    } catch (error) {
      console.error('Error uploading character image:', error);
      setSupportingCharacters(prev => prev.map(char => 
        char.id === characterId ? { ...char, isUploading: false } : char
      ));
      toast({
        title: "Error",
        description: t('imageUploadFailed'),
        variant: "destructive"
      });
    }
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

  // Get sections affected by editing a specific section (using timestamps)
  const getAffectedSections = (sectionKey: string): string[] => {
    if (!job) return [];
    
    // Special handling for 'input' section - it can affect all other sections
    if (sectionKey === 'input') {
      const affected: string[] = [];
      const inputTimestamp = job.input_updated_at;
      const inputTime = inputTimestamp ? new Date(inputTimestamp).getTime() : 0;
      
      // Check all sections to see which ones have data and would be affected
      SECTIONS.forEach(section => {
        const sectionData = job[section.key as keyof StoryboardJob];
        const sectionTimestamp = job[`${section.key}_updated_at` as keyof StoryboardJob] as string | null;
        
        if (sectionData && typeof sectionData === 'object' && Object.keys(sectionData).length > 0) {
          // If section has data and was updated after input (or input has no timestamp), it's affected
          if (sectionTimestamp) {
            const sectionTime = new Date(sectionTimestamp).getTime();
            if (!inputTimestamp || sectionTime > inputTime) {
              affected.push(section.key);
            }
          } else {
            // If no timestamp but has data, consider it affected
            affected.push(section.key);
          }
        }
      });
      
      return affected;
    }
    
    // Regular sections - find their position in the SECTIONS array
    const sectionIndex = SECTIONS.findIndex(s => s.key === sectionKey);
    if (sectionIndex === -1) return [];
    
    const affected: string[] = [];
    const currentTimestamp = job[`${sectionKey}_updated_at` as keyof StoryboardJob] as string | null;
    
    // If current section has no timestamp, check if later sections have data
    if (!currentTimestamp) {
      for (let i = sectionIndex + 1; i < SECTIONS.length; i++) {
        const laterSection = SECTIONS[i];
        const laterData = job[laterSection.key as keyof StoryboardJob];
        if (laterData && typeof laterData === 'object' && Object.keys(laterData).length > 0) {
          affected.push(laterSection.key);
        }
      }
      return affected;
    }
    
    // Compare timestamps to find affected sections
    const currentTime = new Date(currentTimestamp).getTime();
    
    for (let i = sectionIndex + 1; i < SECTIONS.length; i++) {
      const laterSection = SECTIONS[i];
      const laterTimestamp = job[`${laterSection.key}_updated_at` as keyof StoryboardJob] as string | null;
      const laterData = job[laterSection.key as keyof StoryboardJob];
      
      // If later section has data and was updated after current section, it's affected
      if (laterData && typeof laterData === 'object' && Object.keys(laterData).length > 0) {
        if (laterTimestamp) {
          const laterTime = new Date(laterTimestamp).getTime();
          if (laterTime > currentTime) {
            affected.push(laterSection.key);
          }
        } else {
          // If no timestamp but has data, consider it affected
          affected.push(laterSection.key);
        }
      }
    }
    
    return affected;
  };

  // Check if a section should show visual inconsistency indicators
  const getSectionInconsistencyWarning = (sectionKey: string): boolean => {
    if (!job || sectionKey === 'input') return false;
    
    const currentTimestamp = job[`${sectionKey}_updated_at` as keyof StoryboardJob] as string | null;
    if (!currentTimestamp) return false;
    
    const currentTime = new Date(currentTimestamp).getTime();
    
    // Check if input was updated after this section
    const inputTimestamp = job.input_updated_at;
    if (inputTimestamp) {
      const inputTime = new Date(inputTimestamp).getTime();
      if (inputTime > currentTime) {
        return true;
      }
    }
    
    // Check if any previous section was updated after this section
    const sectionIndex = SECTIONS.findIndex(s => s.key === sectionKey);
    if (sectionIndex <= 0) return false;
    
    for (let i = 0; i < sectionIndex; i++) {
      const previousSection = SECTIONS[i];
      const previousTimestamp = job[`${previousSection.key}_updated_at` as keyof StoryboardJob] as string | null;
      
      if (previousTimestamp) {
        const previousTime = new Date(previousTimestamp).getTime();
        if (previousTime > currentTime) {
          return true;
        }
      }
    }
    
    return false;
  };

  const handleCharacterImageUpload = async (characterKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('fileTooLarge'),
        description: t('imageUnder5MB'),
        variant: 'destructive'
      });
      return;
    }

    try {
      const imageUrl = await uploadImageToStorage(file);
      
      // Update character data
      const updatedCharacters = { ...job.characters };
      if (updatedCharacters[characterKey]?.base) {
        updatedCharacters[characterKey].base.face_ref = imageUrl;
      }

      const { error } = await supabase
        .from('storyboard_jobs')
        .update({ 
          characters: updatedCharacters,
          characters_updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      // Refresh job data
      await fetchJob();
      
      toast({
        title: t('imageUploaded'),
        description: t('imageUploadedSuccessfully')
      });
    } catch (error) {
      console.error('Error uploading character image:', error);
      toast({
        title: t('error'),
        description: t('imageUploadFailed'),
        variant: 'destructive'
      });
    }
  };

  const handleRemoveCharacterFaceRef = async (characterKey: string) => {
    if (!job.characters) return;
    
    const updatedCharacters = { ...job.characters };
    if (updatedCharacters[characterKey]?.base) {
      updatedCharacters[characterKey].base.face_ref = null;
    }

    try {
      const { error } = await supabase
        .from('storyboard_jobs')
        .update({ 
          characters: updatedCharacters,
          characters_updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;
      
      // Refresh job data
      await fetchJob();
    } catch (error) {
      console.error('Error removing face reference:', error);
      toast({
        title: t('error'),
        description: t('failedToUpdateCharacter'),
        variant: 'destructive'
      });
    }
  };

  // Character Card Component
  const CharacterCard = ({ characterKey, characterInfo, characterTitle }: { 
    characterKey: string; 
    characterInfo: any; 
    characterTitle: string; 
  }) => {
    const [isEditingBase, setIsEditingBase] = React.useState(false);
    const [editBaseData, setEditBaseData] = React.useState({
      name: characterInfo.base?.name || '',
      gender: characterInfo.base?.gender || '',
      face_ref: characterInfo.base?.face_ref || ''
    });

    // Get face reference from user input if not in character data
    const getFaceRef = () => {
      if (characterInfo.base?.face_ref) return characterInfo.base.face_ref;
      
      // Check user input for face image if this is the lead character
      if (characterKey === 'lead' && job?.user_input) {
        const userInput = job.user_input as any;
        if (userInput.faceImageUrl || faceImagePreview) {
          return userInput.faceImageUrl || faceImagePreview;
        }
      }
      
      return null;
    };

    const handleSaveBaseInfo = async () => {
      try {
        const updates = {
          characters: {
            ...job?.characters,
            [characterKey]: {
              ...characterInfo,
              base: {
                ...characterInfo.base,
                name: editBaseData.name,
                gender: editBaseData.gender,
                face_ref: editBaseData.face_ref
              }
            }
          }
        };

        const { error } = await supabase
          .from('storyboard_jobs')
          .update(updates)
          .eq('id', jobId);

        if (error) throw error;

        toast({
          title: t('success'),
          description: t('characterUpdated'),
        });
        
        setIsEditingBase(false);
        fetchJob(); // Refresh data
      } catch (error) {
        console.error('Error saving base info:', error);
        toast({
          title: t('error'),
          description: t('failedToUpdateCharacter'),
          variant: 'destructive'
        });
      }
    };

    const handleCancelEdit = () => {
      setEditBaseData({
        name: characterInfo.base?.name || '',
        gender: characterInfo.base?.gender || '',
        face_ref: characterInfo.base?.face_ref || ''
      });
      setIsEditingBase(false);
    };

    return (
      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-semibold text-lg">{characterTitle}</h4>
        
        {/* Part 1: Base Info */}
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-medium">{t('baseInfo')}</h5>
            <Button
              variant="outline"
              size="sm"
              onClick={() => isEditingBase ? handleCancelEdit() : setIsEditingBase(true)}
            >
              {isEditingBase ? t('cancel') : t('edit')}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium">{t('name')}</label>
              {isEditingBase ? (
                <Input 
                  value={editBaseData.name} 
                  onChange={(e) => setEditBaseData({...editBaseData, name: e.target.value})}
                  className="mt-1" 
                />
              ) : (
                <Input value={characterInfo.base?.name || ''} disabled className="mt-1" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">{t('gender')}</label>
              {isEditingBase ? (
                <Select value={editBaseData.gender} onValueChange={(value) => setEditBaseData({...editBaseData, gender: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('male')}</SelectItem>
                    <SelectItem value="female">{t('female')}</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input value={characterInfo.base?.gender || ''} disabled className="mt-1" />
              )}
            </div>
          </div>

          {/* Face Reference */}
          <div className="mb-4">
            <label className="text-sm font-medium">{t('faceReference')}</label>
            <p className="text-xs text-muted-foreground mb-2">{t('leaveEmptyForAIGenerated')}</p>
            
            {getFaceRef() ? (
              <div className="flex items-center gap-3">
                <img 
                  src={getFaceRef()!} 
                  alt={t('faceReference')}
                  className="w-16 h-16 object-cover rounded-lg border"
                />
                {isEditingBase && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditBaseData({...editBaseData, face_ref: ''})}
                  >
                    {t('remove')}
                  </Button>
                )}
              </div>
            ) : isEditingBase ? (
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleCharacterImageUpload(characterKey, e)}
                className="mt-1"
              />
            ) : (
              <div className="text-sm text-muted-foreground mt-1">{t('noFileChosen') || 'No file chosen'}</div>
            )}
          </div>

          {isEditingBase && (
            <Button
              onClick={handleSaveBaseInfo}
              className="w-full"
            >
              {t('save')}
            </Button>
          )}

          {!isEditingBase && !characterInfo.description && (
            <Button
              onClick={() => handleGenerateCharacterDescription(characterKey)}
              disabled={isGeneratingDescription[characterKey]}
              className="w-full"
              functionId={functions['generate-character-description']?.id}
            >
              {isGeneratingDescription[characterKey] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('generateDescription')}
            </Button>
          )}
        </div>

        {/* Part 2: Description */}
        {characterInfo.description && (
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium">{t('description')}</h5>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCharacterEditData(prev => ({ 
                    ...prev, 
                    [`${characterKey}_editing`]: !prev[`${characterKey}_editing`] 
                  }))}
                >
                  {characterEditData[`${characterKey}_editing`] ? t('cancel') : t('edit')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateCharacterDescription(characterKey)}
                  disabled={isGeneratingDescription[characterKey]}
                  functionId={functions['generate-character-description']?.id}
                >
                  {isGeneratingDescription[characterKey] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('regenerate')}
                </Button>
              </div>
            </div>

            {characterEditData[`${characterKey}_editing`] ? (
              <div className="space-y-3">
                {renderEditableDescriptionFields(characterKey, characterInfo.description)}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleValidateCharacterDescription(characterKey, characterEditData[characterKey])}
                    disabled={isValidatingDescription[characterKey]}
                    functionId={functions['validate-character-description']?.id}
                  >
                    {isValidatingDescription[characterKey] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('validate')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">{t('ageRange')}:</span>
                  <span className="ml-2">{characterInfo.description.age_range || '-'}</span>
                </div>
                <div>
                  <span className="font-medium">{t('ethnicity')}:</span>
                  <span className="ml-2">{characterInfo.description.ethnicity || '-'}</span>
                </div>
                <div>
                  <span className="font-medium">{t('skinTone')}:</span>
                  <span className="ml-2">{characterInfo.description.skin_tone || '-'}</span>
                </div>
                <div>
                  <span className="font-medium">{t('body')}:</span>
                  <span className="ml-2">{characterInfo.description.body || '-'}</span>
                </div>
                <div>
                  <span className="font-medium">{t('faceFeatures')}:</span>
                  <span className="ml-2">{characterInfo.description.face_features || '-'}</span>
                </div>
                <div>
                  <span className="font-medium">{t('head')}:</span>
                  <span className="ml-2">{characterInfo.description.head || '-'}</span>
                </div>
                <div>
                  <span className="font-medium">{t('clothes')}:</span>
                  <span className="ml-2">{characterInfo.description.clothes || '-'}</span>
                </div>
                <div>
                  <span className="font-medium">{t('personality')}:</span>
                  <span className="ml-2">{characterInfo.description.personality || '-'}</span>
                </div>
              </div>
            )}

            {!characterInfo.portrait_url && characterInfo.description && (
              <Button
                onClick={() => handleGenerateCharacterPortrait(characterKey)}
                disabled={isGeneratingPortrait[characterKey]}
                className="w-full mt-4"
                functionId={functions['generate-character-portrait']?.id}
              >
                {isGeneratingPortrait[characterKey] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('generatePortrait')}
              </Button>
            )}
          </div>
        )}

        {/* Part 3: Portrait */}
        {characterInfo.portrait_url && (
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium">{t('portrait')}</h5>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateCharacterPortrait(characterKey)}
                disabled={isGeneratingPortrait[characterKey]}
                functionId={functions['generate-character-portrait']?.id}
              >
                {isGeneratingPortrait[characterKey] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('regenerate')}
              </Button>
            </div>
            
            <div className="flex justify-center">
              <img
                src={characterInfo.portrait_url}
                alt={`${characterInfo.base?.name} ${t('portrait')}`}
                className="max-w-64 max-h-64 object-cover rounded-lg border"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEditableDescriptionFields = (characterKey: string, description: any) => {
    const fields = ['age_range', 'ethnicity', 'skin_tone', 'body', 'face_features', 'head', 'clothes', 'personality'];
    
    return (
      <div className="grid grid-cols-2 gap-3">
        {fields.map(field => (
          <div key={field}>
            <label className="text-sm font-medium">{t(field)}</label>
            <Input
              value={characterEditData[characterKey]?.[field] || description[field] || ''}
              onChange={(e) => setCharacterEditData(prev => ({
                ...prev,
                [characterKey]: {
                  ...prev[characterKey],
                  [field]: e.target.value
                }
              }))}
              className="mt-1"
            />
          </div>
        ))}
      </div>
    );
  };

  // Enhanced edit impact check with detailed information
  const checkEditImpact = (sectionKey: string): { hasImpact: boolean; affectedSections: string[] } => {
    const affected = getAffectedSections(sectionKey);
    return {
      hasImpact: affected.length > 0,
      affectedSections: affected
    };
  };

  // Delete progressive data for affected sections
  const deleteProgressiveData = async (fromSection: string) => {
    if (!job || !jobId) return;
    
    const affectedSectionKeys = getAffectedSections(fromSection);
    if (affectedSectionKeys.length === 0) return;
    
    try {
      // Prepare update object to clear affected sections and their timestamps
      const updates: any = {};
      
      affectedSectionKeys.forEach(sectionKey => {
        updates[sectionKey] = null;
        updates[`${sectionKey}_updated_at`] = null;
      });
      
      console.log('🗑️ Deleting progressive data for sections:', affectedSectionKeys, updates);
      
      const { error } = await supabase
        .from('storyboard_jobs')
        .update(updates)
        .eq('id', jobId);
      
      if (error) throw error;
      
      toast({
        title: "Progressive data cleared",
        description: `Cleared data from ${affectedSectionKeys.length} affected section(s)`,
      });
      
      // Clear local warnings for deleted sections
      setSectionWarnings(prev => {
        const newWarnings = { ...prev };
        affectedSectionKeys.forEach(key => {
          delete newWarnings[key];
        });
        return newWarnings;
      });
      
    } catch (error) {
      console.error('Error deleting progressive data:', error);
      toast({
        title: "Error",
        description: "Failed to delete progressive data",
        variant: "destructive"
      });
    }
  };

  // Fetch functions from database
  const fetchFunctions = async () => {
    try {
      console.log('🔍 Fetching functions from database...');
      const { data, error } = await supabase
        .from('n8n_functions')
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
          leadName: userInput.lead_name || '',
          leadGender: userInput.lead_gender || '',
          leadAiCharacter: userInput.leadAiCharacter || false,
          language: userInput.language || 'English',
          accent: userInput.accent || 'US',
          size: userInput.size || '',
          prompt: userInput.prompt || ''
        });
        
        setSelectedGenres(userInput.genres || []);
        
        if (userInput.face_ref_url) {
          setFaceImagePreview(userInput.face_ref_url);
        }
        
        setSupportingCharacters(userInput.supporting_characters || []);
      }
      
      // Initialize movie data using user input language
      if (data.movie_info && typeof data.movie_info === 'object') {
        const movieInfo = data.movie_info;
        console.log('🎬 Setting movie data:', movieInfo);
        setMovieData({
          title: (movieInfo as any).title || '',
          logline: (movieInfo as any).logline || '',
          world: (movieInfo as any).world || '',
          look: (movieInfo as any).look || '',
          characters: {
            lead: {
              name: (movieInfo as any).characters?.lead?.name || '',
              gender: (movieInfo as any).characters?.lead?.gender || ''
            },
            supporting: {
              name: (movieInfo as any).characters?.supporting?.name || '',
              gender: (movieInfo as any).characters?.supporting?.gender || ''
            }
          }
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

  // Execute function via execute-function edge function (now using N8N envelope)
  const executeFunction = async (functionName: string, payload: any) => {
    console.log(`🎯 Executing function: ${functionName}`, { payload });
    
    const functionData = functions[functionName];
    if (!functionData) {
      throw new Error(`Function ${functionName} not found`);
    }

    console.log('💰 Function details:', functionData, '| User credits:', credits);

    const { data: envelope, error } = await supabase.functions.invoke('execute-function', {
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

    console.log('📡 Execute-function envelope response:', { envelope, error });

    if (error) {
      throw new Error(error.message || `Failed to execute ${functionName}`);
    }
    
    // Check envelope status instead of legacy success field
    if (envelope?.status === 'error') {
      const errorCode = envelope.error?.code;
      const errorMessage = envelope.error?.message || `${functionName} execution failed`;
      
      // Handle specific error codes with better user messages
      if (errorCode === 'INSUFFICIENT_CREDITS') {
        const details = envelope.error?.details as any;
        throw new Error(`Insufficient credits. Required: ${details?.required_credits || functionData.price} credits`);
      }
      
      throw new Error(errorMessage);
    }
    
    // Return the parsed data from the envelope
    return {
      success: envelope?.status === 'success',
      data: envelope?.data || envelope?.data?.parsed || envelope?.data?.raw_response,
      envelope, // Include full envelope for debugging/logging
      request_id: envelope?.request_id,
      credits_consumed: envelope?.meta?.credits_consumed || 0
    };
  };

  // Generate section handler
  const handleGenerate = async (sectionKey: string) => {
    const section = SECTIONS.find(s => s.key === sectionKey);
    if (!section) return;

    console.log(`🚀 Generating section: ${sectionKey}`);
    
    setLoadingSections(prev => ({ ...prev, [sectionKey]: true }));
    
    try {
      if (sectionKey === 'characters') {
        // Handle characters generation specially
        await handleGenerateCharacters();
      } else {
        // Handle other sections with N8N functions
        await executeFunction('generate-movie-info', {
          table_id: 'storyboard_jobs',
          row_id: jobId
        });
      }
      
      // Fetch latest data from database after successful generation
      await fetchJob();
      
      // Open the section after successful generation
      setOpenSections(prev => ({ ...prev, [sectionKey]: true }));
      
      // Clear any warnings for the regenerated section
      setSectionWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings[sectionKey];
        return newWarnings;
      });
      
      // Clear override mode if no more warnings exist
      setOverrideMode(prev => {
        const remainingWarnings = Object.keys(sectionWarnings).filter(key => key !== sectionKey);
        return remainingWarnings.length > 0;
      });
      
      toast({
        title: "Success",
        description: `${section.title} generated successfully`,
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

  // Character Generation Functions
  const handleGenerateCharacters = async () => {
    if (!job) return;

    console.log('🎭 Generating characters from user input:', job.user_input);

    try {
      // Extract character data from user_input
      const userInput = job.user_input || {};
      const leadName = userInput.lead_name || userInput.leadName || '';
      const leadGender = userInput.lead_gender || userInput.leadGender || '';
      const faceImageUrl = userInput.face_ref_url || userInput.faceImageUrl || null;
      
      const supportingChars = userInput.supporting_characters || userInput.supportingCharacters || [];
      const supportingChar = supportingChars.length > 0 ? supportingChars[0] : null;

      const initialCharacterData: any = {
        lead: {
          base: {
            name: leadName,
            gender: leadGender,
            face_ref: faceImageUrl
          }
        }
      };

      if (supportingChar) {
        initialCharacterData.supporting = {
          base: {
            name: supportingChar.name || '',
            gender: supportingChar.gender || '',
            face_ref: supportingChar.faceImageUrl || supportingChar.faceImagePreview || null
          }
        };
      }

      console.log('💾 Updating characters in database:', initialCharacterData);

      // Update database with initial character data
      const { error } = await supabase
        .from('storyboard_jobs')
        .update({ 
          characters: initialCharacterData,
          characters_updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      setCharacterData(initialCharacterData);
      
    } catch (error) {
      console.error('Error generating characters:', error);
      throw error; // Re-throw to be handled by the caller
    }
  };

  const handleGenerateCharacterDescription = async (characterKey: string) => {
    const descriptionFunction = functions['generate-character-description'];
    if (!descriptionFunction) {
      toast({
        title: t('error'),
        description: t('functionNotAvailable'),
        variant: 'destructive'
      });
      return;
    }

    setIsGeneratingDescription(prev => ({ ...prev, [characterKey]: true }));
    
    try {
      await executeFunction('generate-character-description', {
        table_id: 'storyboard_jobs',
        row_id: jobId,
        character_key: characterKey
      });

      // Refresh job data to get updated character info
      await fetchJob();

      toast({
        title: t('success'),
        description: t('characterDescriptionGenerated')
      });

    } catch (error) {
      console.error('Error generating character description:', error);
      toast({
        title: t('error'),
        description: t('failedToGenerateDescription'),
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingDescription(prev => ({ ...prev, [characterKey]: false }));
    }
  };

  const handleValidateCharacterDescription = async (characterKey: string, descriptionData: any) => {
    const validationFunction = functions['validate-character-description'];
    if (!validationFunction) {
      toast({
        title: t('error'),
        description: t('functionNotAvailable'),
        variant: 'destructive'
      });
      return;
    }

    setIsValidatingDescription(prev => ({ ...prev, [characterKey]: true }));
    
    try {
      await executeFunction('validate-character-description', {
        table_id: 'storyboard_jobs',
        row_id: jobId,
        character_key: characterKey,
        description_data: descriptionData
      });

      // Refresh job data
      await fetchJob();

      toast({
        title: t('success'),
        description: t('characterDescriptionValidated')
      });

    } catch (error) {
      console.error('Error validating character description:', error);
      toast({
        title: t('error'),
        description: t('failedToValidateDescription'),
        variant: 'destructive'
      });
    } finally {
      setIsValidatingDescription(prev => ({ ...prev, [characterKey]: false }));
    }
  };

  const handleGenerateCharacterPortrait = async (characterKey: string) => {
    const portraitFunction = functions['generate-character-portrait'];
    if (!portraitFunction) {
      toast({
        title: t('error'),
        description: t('functionNotAvailable'),
        variant: 'destructive'
      });
      return;
    }

    setIsGeneratingPortrait(prev => ({ ...prev, [characterKey]: true }));
    
    try {
      await executeFunction('generate-character-portrait', {
        table_id: 'storyboard_jobs',
        row_id: jobId,
        character_key: characterKey
      });

      // Refresh job data
      await fetchJob();

      toast({
        title: t('success'),
        description: t('characterPortraitGenerated')
      });

    } catch (error) {
      console.error('Error generating character portrait:', error);
      toast({
        title: t('error'),
        description: t('failedToGeneratePortrait'),
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingPortrait(prev => ({ ...prev, [characterKey]: false }));
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
          const movieInfo = job.movie_info;
          setMovieData({
            title: (movieInfo as any).title || '',
            logline: (movieInfo as any).logline || '',
            world: (movieInfo as any).world || '',
            look: (movieInfo as any).look || '',
            characters: {
              lead: {
                name: (movieInfo as any).characters?.lead?.name || '',
                gender: (movieInfo as any).characters?.lead?.gender || ''
              },
              supporting: {
                name: (movieInfo as any).characters?.supporting?.name || '',
                gender: (movieInfo as any).characters?.supporting?.gender || ''
              }
            }
          });
        }
      }
      
      setEditingSections(prev => ({ ...prev, [sectionKey]: false }));
      
      // Clear any warnings for the saved section
      setSectionWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings[sectionKey];
        return newWarnings;
      });
      
      return;
    }

    // Starting to edit - ensure section is expanded
    setOpenSections(prev => ({ ...prev, [sectionKey]: true }));

    // Check for impact on later sections
    const impactResult = checkEditImpact(sectionKey);
    
    if (impactResult.hasImpact) {
      setPendingEdit({ 
        section: sectionKey, 
        hasLaterData: true, 
        affectedSections: impactResult.affectedSections 
      });
      setAffectedSections(impactResult.affectedSections);
      setShowEditWarning(true);
    } else {
      setEditingSections(prev => ({ ...prev, [sectionKey]: true }));
    }
  };

  // Handle warning dialog actions
  const handleEditWarningAction = async (action: 'discard' | 'delete' | 'override') => {
    if (!pendingEdit) return;
    
    const { section, affectedSections: affected } = pendingEdit;
    
    if (action === 'discard') {
      // Just close dialog, don't start editing
      setShowEditWarning(false);
      setPendingEdit(null);
      setAffectedSections([]);
    } else if (action === 'delete') {
      // Delete progressive data for affected sections
      await deleteProgressiveData(section);
      
      // Ensure section is expanded when editing starts
      setOpenSections(prev => ({ ...prev, [section]: true }));
      setEditingSections(prev => ({ ...prev, [section]: true }));
      setShowEditWarning(false);
      setPendingEdit(null);
      setAffectedSections([]);
      setOverrideMode(false);
    } else if (action === 'override') {
      // Start editing with warning acknowledged and mark affected sections
      setOpenSections(prev => ({ ...prev, [section]: true }));
      setEditingSections(prev => ({ ...prev, [section]: true }));
      setOverrideMode(true);
      
      // Mark affected sections with warnings
      const newWarnings: Record<string, boolean> = {};
      affected.forEach(sectionKey => {
        newWarnings[sectionKey] = true;
      });
      setSectionWarnings(newWarnings);
      
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

      const inputPayload = {
        template: formData.template,
        lead_name: formData.leadName,
        lead_gender: formData.leadGender,
        language: formData.language,
        accent: formData.accent,
        genres: selectedGenres,
        prompt: formData.prompt,
        size: formData.size,
        face_ref_url: faceImagePreview,
        supporting_characters: processedSupportingCharacters
      };

      const { error } = await supabase
        .from('storyboard_jobs')
        .update({ 
          user_input: inputPayload,
          input_updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job information saved successfully",
      });
      
      setEditingSections(prev => ({ ...prev, input: false }));
      
      // Clear any warnings for the saved section
      setSectionWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings['input'];
        return newWarnings;
      });
      
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

  // Validate movie info handler (edit mode)
  const handleValidateMovieInfo = async () => {
    try {
      setIsValidating(true);
      
      const validateFunction = functions['validate-movie-info'];
      if (!validateFunction) {
        toast({
          title: "Error",
          description: "Validation function not available",
          variant: "destructive"
        });
        return;
      }
      
      setValidationStatus('validating');
      
      const result = await executeFunction('validate-movie-info', {
        table_id: 'storyboard_jobs',
        row_id: jobId,
        edits: {
          title: movieData.title,
          logline: movieData.logline,
          world: movieData.world,
          look: movieData.look,
          characters: movieData.characters
        }
      });
      
      // executeFunction now throws on error, so if we reach here it's successful
      console.log('🔍 Validation result structure:', {
        hasData: !!result.data,
        hasEnvelopeData: !!result.envelope?.data,
        envelopeStatus: result.envelope?.status,
        fullResult: result
      });
      
      // Try to extract response data from the envelope directly  
      const response = result.envelope?.data || result.data;
      
      // Check if response exists and has the expected structure
      if (!response) {
        console.error('❌ Validation response is undefined - both result.data and result.envelope.data are missing:', result);
        setValidationStatus('invalid');
        toast({
          title: "Error",
          description: "Invalid validation response received",
          variant: "destructive"
        });
        return;
      }
      
      if (response.valid) {
        setValidationStatus('valid');
        setValidationReason(null);
        setSuggestedFix(null);
        toast({
          title: t('validationPassed'),
          description: "Movie information is valid",
        });
      } else {
        setValidationStatus('invalid');
        setValidationReason(response.reason || null);
        setSuggestedFix(response.suggested_fix || null);
        
        const currentLanguage = (job?.user_input as any)?.language === 'Arabic' ? 'ar' : 'en';
        const reasonText = response.reason?.[currentLanguage] || response.reason?.en || 'Validation failed';
        
        toast({
          title: t('validationFailed'),
          description: reasonText,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('❌ Error validating movie info:', error);
      setValidationStatus('invalid');
      toast({
        title: "Error",
        description: "Failed to validate movie information",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Apply suggested fixes
  const handleApplySuggestions = () => {
    if (suggestedFix) {
      setMovieData({
        title: suggestedFix.movie_title || movieData.title,
        logline: suggestedFix.logline || movieData.logline,
        world: suggestedFix.world || movieData.world,
        look: suggestedFix.look || movieData.look,
        characters: {
          lead: {
            name: suggestedFix.characters?.lead?.name || movieData.characters.lead?.name || '',
            gender: suggestedFix.characters?.lead?.gender || movieData.characters.lead?.gender || ''
          },
          supporting: suggestedFix.characters?.supporting ? {
            name: suggestedFix.characters.supporting.name,
            gender: suggestedFix.characters.supporting.gender
          } : movieData.characters.supporting
        }
      });
      
      // Update supporting characters if suggestions exist
      if (suggestedFix.characters?.supporting) {
        setSupportingCharacters(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[0] = { 
              ...updated[0], 
              name: suggestedFix.characters!.supporting!.name, 
              gender: suggestedFix.characters!.supporting!.gender 
            };
          }
          return updated;
        });
      }
      
      // Clear validation status when user applies suggestions
      setValidationStatus(null);
      setValidationReason(null);
      setSuggestedFix(null);
    }
  };

  // Save movie info handler (direct save without validation function)
  const handleSaveMovieInfo = async () => {
    try {
      // Check if validation is required
      const validateFunction = functions['validate-movie-info'];
      if (validateFunction && validationStatus !== 'valid') {
        toast({
          title: t('validationRequired'),
          description: "Please validate your movie information first",
          variant: "destructive"
        });
        return;
      }
      
      // Set loading state
      setLoadingSections(prev => ({ ...prev, movie_info: true }));
      
      // Always save directly to DB (no credits consumed)
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

      setEditingSections(prev => ({ ...prev, movie_info: false }));
      
      // Clear any warnings for the saved section
      setSectionWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings['movie_info'];
        return newWarnings;
      });
      
      // Clear override mode if no more warnings exist
      setOverrideMode(prev => {
        const remainingWarnings = Object.keys(sectionWarnings).filter(key => key !== 'movie_info');
        return remainingWarnings.length > 0;
      });
      
      // Reset validation status after successful save
      setValidationStatus(null);
      setValidationReason(null);
      setSuggestedFix(null);
      fetchJob(); // Refresh data
      
    } catch (error) {
      console.error('❌ Error saving movie info:', error);
      toast({
        title: "Error",
        description: "Failed to save movie information",
        variant: "destructive"
      });
    } finally {
      // Clear loading state
      setLoadingSections(prev => ({ ...prev, movie_info: false }));
    }
  };

  // Validate movie info handler (view mode)
  const handleValidateMovieInfoViewMode = async () => {
    try {
      setIsValidating(true);
      
      const validateFunction = functions['validate-movie-info'];
      if (!validateFunction) {
        toast({
          title: "Error",
          description: "Validation function not available",
          variant: "destructive"
        });
        return;
      }
      
      const currentMovieData = {
        title: getMovieInfoValue(job?.movie_info, 'title', ''),
        logline: getMovieInfoValue(job?.movie_info, 'logline', ''),
        world: getMovieInfoValue(job?.movie_info, 'world', ''),
        look: getMovieInfoValue(job?.movie_info, 'look', '')
      };
      
      const result = await executeFunction('validate-movie-info', {
        table_id: 'storyboard_jobs',
        row_id: jobId,
        edits: {
          title: currentMovieData.title,
          logline: currentMovieData.logline,
          world: currentMovieData.world,
          look: currentMovieData.look,
          characters: job?.movie_info?.characters || {
            lead: {
              name: (job?.user_input as any)?.leadName || '',
              gender: (job?.user_input as any)?.leadGender || ''
            },
            supporting: (job?.user_input as any)?.supportingCharacters?.[0] ? {
              name: (job?.user_input as any)?.supportingCharacters[0]?.name || '',
              gender: (job?.user_input as any)?.supportingCharacters[0]?.gender || ''
            } : undefined
          }
        }
      });
      
      // executeFunction now throws on error, so if we reach here it's successful  
      console.log('🔍 View mode validation result structure:', {
        hasData: !!result.data,
        hasEnvelopeData: !!result.envelope?.data,
        envelopeStatus: result.envelope?.status,
        fullResult: result
      });
      
      // Try to extract response data from the envelope directly  
      const response = result.envelope?.data || result.data;
      
      // Check if response exists and has the expected structure
      if (!response) {
        console.error('❌ View mode validation response is undefined - both result.data and result.envelope.data are missing:', result);
        toast({
          title: "Error", 
          description: "Invalid validation response received",
          variant: "destructive"
        });
        return;
      }
      
      if (response.valid) {
        toast({
          title: t('validationPassed'),
          description: "Movie information is valid",
        });
      } else {
        const currentLanguage = (job?.user_input as any)?.language === 'Arabic' ? 'ar' : 'en';
        const reasonText = response.reason?.[currentLanguage] || response.reason?.en || 'Validation failed';
        
        toast({
          title: t('validationFailed'),
          description: reasonText,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('❌ Error validating movie info:', error);
      toast({
        title: "Error",
        description: "Failed to validate movie information",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Regenerate movie info handler
  const handleRegenerateMovieInfo = async () => {
    try {
      const generateFunction = functions['generate-movie-info'];
      if (!generateFunction) {
        toast({
          title: "Error",
          description: "Generation function not available",
          variant: "destructive"
        });
        return;
      }
      
      // Show confirmation dialog
      setShowRegenerateWarning(true);
      
      // Call the same generate function as initial generation  
      // This will be called from the dialog action
      // await handleGenerate('movie_info');
      
    } catch (error) {
      console.error('❌ Error regenerating movie info:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate movie information",
        variant: "destructive"
      });
    }
  };

  // Delete section handler
  const handleDeleteSection = (sectionKey: string) => {
    // Get all sections that come after this section
    const sectionIndex = SECTIONS.findIndex(s => s.key === sectionKey);
    if (sectionIndex === -1) return;
    
    const affectedSections = SECTIONS.slice(sectionIndex).map(s => s.key);
    
    setPendingDelete({ section: sectionKey, affectedSections });
    setShowDeleteWarning(true);
  };

  // Confirm delete section
  const confirmDeleteSection = async () => {
    if (!pendingDelete || !job) return;
    
    try {
      const updates: any = {};
      
      // Clear data for this section and all following sections
      pendingDelete.affectedSections.forEach(sectionKey => {
        updates[sectionKey] = null;
        updates[`${sectionKey}_updated_at`] = null;
      });

      const { error } = await supabase
        .from('storyboard_jobs')
        .update(updates)
        .eq('id', job.id);

      if (error) throw error;

      toast({
        title: "Section Deleted",
        description: "Section and all following sections have been deleted.",
      });

      // Refresh job data
      fetchJob();
      
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: "Error",
        description: "Failed to delete section",
        variant: "destructive"
      });
    } finally {
      setShowDeleteWarning(false);
      setPendingDelete(null);
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
            const movieInfo = newData.movie_info;
            setMovieData({
              title: (movieInfo as any).title || '',
              logline: (movieInfo as any).logline || '',
              world: (movieInfo as any).world || '',
              look: (movieInfo as any).look || '',
              characters: {
                lead: {
                  name: (movieInfo as any).characters?.lead?.name || '',
                  gender: (movieInfo as any).characters?.lead?.gender || ''
                },
                supporting: {
                  name: (movieInfo as any).characters?.supporting?.name || '',
                  gender: (movieInfo as any).characters?.supporting?.gender || ''
                }
              }
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
                {editingSections.input && <Badge variant="outline">{t('editing')}</Badge>}
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
                   
                   {/* Face Reference Image */}
                   <div className="space-y-2">
                     <label className="text-sm font-medium">{t('faceReferenceImage')}</label>
                     {faceImagePreview && !formData.leadAiCharacter ? (
                       <div className="flex items-center gap-4">
                         <img src={faceImagePreview} alt={t('faceReferenceImage')} className="w-20 h-20 rounded-lg object-cover border" />
                         <div className="space-y-2">
                           <p className="text-sm text-muted-foreground">{t('faceImageUploaded')}</p>
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={handleRemoveImage}
                           >
                             {t('remove')}
                           </Button>
                         </div>
                       </div>
                     ) : (
                       <div className="space-y-2">
                         <p className="text-sm text-muted-foreground">{t('uploadFaceReference')}</p>
                         <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                           {isUploadingFaceImage ? (
                             <div className="flex flex-col items-center gap-2">
                               <Loader2 className="h-6 w-6 animate-spin" />
                               <p className="text-sm">{t('uploading')}...</p>
                             </div>
                           ) : (
                             <>
                               <input
                                 id="face-image-upload"
                                 type="file"
                                 accept="image/*"
                                 className="hidden"
                                 onChange={handleImageUpload}
                                 disabled={isUploadingFaceImage}
                               />
                               <Button
                                 type="button"
                                 variant="outline"
                                 onClick={() => document.getElementById('face-image-upload')?.click()}
                                 disabled={isUploadingFaceImage}
                               >
                                 {t('uploadImage')}
                               </Button>
                             </>
                           )}
                         </div>
                       </div>
                     )}
                   </div>

                    {/* Supporting Characters */}
                    <SupportingCharacterSection
                      supportingCharacters={supportingCharacters}
                      onCharactersChange={setSupportingCharacters}
                      onImageUpload={uploadSupportingCharacterImageDirect}
                      isCollapsed={false}
                      disabled={!editingSections.input}
                    />
                   
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
                      <Badge variant="outline" className="mt-1">{t('aiGeneratedCharacter')}</Badge>
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
                          <Badge key={genre} variant="outline">
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
                  functionId={section.generateFunctionId ? functions[section.generateFunctionId]?.id : undefined}
                >
                  <section.icon className="h-5 w-5 mr-2" />
                  {t('generate')} {section.title}
                </Button>
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
              <Card key={section.key} className={cn(
                "transition-all", 
                isEditing && "ring-2 ring-primary/50",
                (sectionWarnings[section.key] || getSectionInconsistencyWarning(section.key)) && "ring-2 ring-amber-500/50 border-amber-500/30 bg-amber-500/10"
              )}>
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => !isAnyEditMode && setOpenSections(prev => ({ ...prev, [section.key]: !prev[section.key] }))}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <section.icon className="h-5 w-5" />
                      {section.title}
                      {isEditing && <Badge variant="outline">{t('editing')}</Badge>}
                      {(sectionWarnings[section.key] || getSectionInconsistencyWarning(section.key)) && (
                        <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {t('mayBeInconsistent')}
                        </Badge>
                      )}
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardTitle>
                      <div className="flex items-center gap-2">
                       {lastUpdated && (
                         <div className="text-xs text-muted-foreground">
                           <Clock className="h-3 w-3 inline mr-1" />
                           {new Date(lastUpdated).toLocaleString()}
                         </div>
                       )}
                         {/* View mode buttons - only show when not editing */}
                         {!isEditing && section.key === 'movie_info' && (
                           <>
                              {/* Regenerate Button */}
                              {functions['generate-movie-info'] && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                     e.stopPropagation();
                                     handleRegenerateMovieInfo();
                                  }}
                                  disabled={isAnyEditMode || loadingSections[section.key]}
                                  className="flex items-center gap-1.5 px-3"
                                  functionId={functions['generate-movie-info']?.id}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                             )}
                          </>
                         )}
                         
                         {/* Characters regenerate button */}
                         {!isEditing && section.key === 'characters' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerate('characters');
                             }}
                             disabled={isAnyEditMode || loadingSections[section.key]}
                             className="flex items-center gap-1.5 px-3"
                             functionId={functions['generate-character-description']?.id}
                           >
                             <RefreshCw className="h-4 w-4" />
                           </Button>
                         )}
                        
                        {/* Delete Button - only show when open and not editing */}
                        {openSections[section.key] && !isAnyEditMode && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSection(section.key);
                            }}
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Edit Button - only show for movie_info section, characters section doesn't have edit */}
                        {section.key === 'movie_info' && (
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
                        )}
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
                            onChange={(e) => {
                              setMovieData({ ...movieData, title: e.target.value });
                              // Clear validation status when user manually edits
                              if (validationStatus) {
                                setValidationStatus(null);
                                setValidationReason(null);
                                setSuggestedFix(null);
                              }
                            }}
                            disabled={isValidating}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">{t('logline')}</label>
                          <Textarea
                            value={movieData.logline}
                            onChange={(e) => {
                              setMovieData({ ...movieData, logline: e.target.value });
                              // Clear validation status when user manually edits
                              if (validationStatus) {
                                setValidationStatus(null);
                                setValidationReason(null);
                                setSuggestedFix(null);
                              }
                            }}
                            rows={3}
                            disabled={isValidating}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">{t('world')}</label>
                          <Input
                            value={movieData.world}
                            onChange={(e) => {
                              setMovieData({ ...movieData, world: e.target.value });
                              // Clear validation status when user manually edits
                              if (validationStatus) {
                                setValidationStatus(null);
                                setValidationReason(null);
                                setSuggestedFix(null);
                              }
                            }}
                            disabled={isValidating}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">{t('look')}</label>
                          <Input
                            value={movieData.look}
                            onChange={(e) => {
                              setMovieData({ ...movieData, look: e.target.value });
                              // Clear validation status when user manually edits
                              if (validationStatus) {
                                setValidationStatus(null);
                                setValidationReason(null);
                                setSuggestedFix(null);
                              }
                            }}
                            disabled={isValidating}
                          />
                        </div>

                        {/* Characters Section */}
                        <div className="space-y-4">
                          <div className="text-sm font-medium">Initial Characters</div>
                          
                          {/* Lead Character */}
                          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                            <div className="text-xs font-medium text-muted-foreground">Lead Character</div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium">Name</label>
                                <Input
                                  value={movieData.characters.lead.name}
                                  onChange={(e) => {
                                    setMovieData({
                                      ...movieData,
                                      characters: {
                                        ...movieData.characters,
                                        lead: {
                                          ...movieData.characters.lead,
                                          name: e.target.value
                                        }
                                      }
                                    });
                                  }}
                                  disabled={isValidating}
                                  placeholder="Character name"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium">Gender</label>
                                <Select
                                  value={movieData.characters.lead.gender}
                                  onValueChange={(value) => {
                                    setMovieData({
                                      ...movieData,
                                      characters: {
                                        ...movieData.characters,
                                        lead: {
                                          ...movieData.characters.lead,
                                          gender: value
                                        }
                                      }
                                    });
                                  }}
                                  disabled={isValidating}
                                >
                                  <SelectTrigger className="bg-background border-border">
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background border-border z-50">
                                    {getGenderOptions().map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          {/* Supporting Character */}
                          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                            <div className="text-xs font-medium text-muted-foreground">Supporting Character</div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium">Name</label>
                                <Input
                                  value={movieData.characters.supporting.name}
                                  onChange={(e) => {
                                    setMovieData({
                                      ...movieData,
                                      characters: {
                                        ...movieData.characters,
                                        supporting: {
                                          ...movieData.characters.supporting,
                                          name: e.target.value
                                        }
                                      }
                                    });
                                  }}
                                  disabled={isValidating}
                                  placeholder="Character name"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium">Gender</label>
                                <Select
                                  value={movieData.characters.supporting.gender}
                                  onValueChange={(value) => {
                                    setMovieData({
                                      ...movieData,
                                      characters: {
                                        ...movieData.characters,
                                        supporting: {
                                          ...movieData.characters.supporting,
                                          gender: value
                                        }
                                      }
                                    });
                                  }}
                                  disabled={isValidating}
                                >
                                  <SelectTrigger className="bg-background border-border">
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background border-border z-50">
                                    {getGenderOptions().map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Validation Status Display */}
                        {validationStatus && (
                          <div className={cn(
                            "p-3 rounded-lg border",
                            validationStatus === 'valid' ? "bg-green-500/10 border-green-500/20 text-green-400" :
                            validationStatus === 'invalid' ? "bg-destructive/10 border-destructive/20 text-destructive" :
                            "bg-primary/10 border-primary/20 text-primary"
                          )}>
                            {validationStatus === 'valid' && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                <span className="font-medium text-green-400">{t('validationPassed')}</span>
                              </div>
                            )}
                            {validationStatus === 'invalid' && validationReason && (
                              <div className="space-y-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <X className="h-4 w-4 text-destructive" />
                                  <span className="font-medium text-destructive">{t('validationFailed')}</span>
                                </div>
                                <p className="text-sm text-destructive/80">
                                  {validationReason[(job?.user_input as any)?.language === 'Arabic' ? 'ar' : 'en'] || validationReason.en}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Suggested Fixes */}
                        {suggestedFix && validationStatus === 'invalid' && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-amber-300">{t('suggestedImprovements')}:</span>
                              <Button 
                                onClick={handleApplySuggestions}
                                size="sm"
                                variant="outline"
                              >
                                {t('applySuggestions')}
                              </Button>
                            </div>
                               <div className="space-y-1 text-sm text-amber-700">
                                {suggestedFix.movie_title && (
                                  <div><strong>Title:</strong> {suggestedFix.movie_title}</div>
                                )}
                                {suggestedFix.logline && (
                                  <div><strong>Logline:</strong> {suggestedFix.logline}</div>
                                )}
                                {suggestedFix.world && (
                                  <div><strong>World:</strong> {suggestedFix.world}</div>
                                )}
                                {suggestedFix.look && (
                                  <div><strong>Look:</strong> {suggestedFix.look}</div>
                                )}
                                {suggestedFix.characters?.lead?.name && (
                                  <div><strong>{t('leadCharacter')} Name:</strong> {suggestedFix.characters.lead.name}</div>
                                )}
                                {suggestedFix.characters?.lead?.gender && (
                                  <div><strong>{t('leadCharacter')} Gender:</strong> {suggestedFix.characters.lead.gender}</div>
                                )}
                                {suggestedFix.characters?.supporting && (
                                  <div>
                                    <strong>{t('supportingCharacter')}:</strong>
                                    <div className="ml-2">
                                      {suggestedFix.characters.supporting.name} ({suggestedFix.characters.supporting.gender})
                                    </div>
                                  </div>
                                )}
                              </div>
                          </div>
                        )}
                        
                         <div className="flex gap-2 items-center flex-wrap">
                           {/* Validate Button */}
                           {functions['validate-movie-info'] && (
                              <Button 
                                onClick={handleValidateMovieInfo} 
                                variant="outline" 
                                className="flex items-center gap-2"
                                disabled={isValidating || loadingSections.movie_info}
                                functionId={functions['validate-movie-info']?.id}
                              >
                                {isValidating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                                {isValidating ? t('validating') : t('validate')}
                              </Button>
                           )}
                           
                           {/* Save Button */}
                           <Button 
                             onClick={handleSaveMovieInfo} 
                             variant="default" 
                             className="flex items-center gap-2"
                             disabled={
                               loadingSections.movie_info || 
                               isValidating ||
                               (functions['validate-movie-info'] && validationStatus !== 'valid')
                             }
                           >
                             {loadingSections.movie_info ? (
                               <Loader2 className="h-4 w-4 animate-spin" />
                             ) : (
                               <Save className="h-4 w-4" />
                             )}
                             {loadingSections.movie_info ? t('saving') : t('save')}
                             {functions['validate-movie-info'] && validationStatus !== 'valid' && (
                               <span className="text-xs opacity-75">
                                 ({t('validationRequired')})
                               </span>
                             )}
                           </Button>
                          
                          <Button 
                            onClick={() => {
                              handleEditToggle('movie_info');
                              // Reset validation state when canceling
                              setValidationStatus(null);
                              setValidationReason(null);
                              setSuggestedFix(null);
                            }} 
                            variant="outline"
                            disabled={loadingSections.movie_info || isValidating}
                          >
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
                              <div className="text-lg font-semibold">{getMovieInfoValue(job.movie_info, 'title', t('notAvailable'))}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-primary">{t('logline')}</div>
                              <div>{getMovieInfoValue(job.movie_info, 'logline', t('notAvailable'))}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm font-medium text-primary">{t('world')}</div>
                                <div>{getMovieInfoValue(job.movie_info, 'world', t('notAvailable'))}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-primary">{t('look')}</div>
                                <div>{getMovieInfoValue(job.movie_info, 'look', t('notAvailable'))}</div>
                              </div>
                            </div>
                            {/* Debug logging for characters */}
                            {console.log('🎬 Movie info characters debug:', {
                              hasCharacters: !!job.movie_info?.characters,
                              characters: job.movie_info?.characters,
                              leadExists: !!job.movie_info?.characters?.lead,
                              supportingExists: !!job.movie_info?.characters?.supporting
                            })}
                            {job.movie_info?.characters && (
                              <div>
                                <div className="text-sm font-medium text-primary mb-2">Initial Characters</div>
                                <div className="grid grid-cols-2 gap-4">
                                  {job.movie_info.characters.lead && (
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                      <div className="text-xs font-medium text-muted-foreground mb-1">Lead Character</div>
                                      <div className="font-medium">{job.movie_info.characters.lead.name || 'Not Available'}</div>
                                      <div className="text-sm text-muted-foreground">{job.movie_info.characters.lead.gender || 'Not Available'}</div>
                                    </div>
                                  )}
                                  {job.movie_info.characters.supporting && (
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                      <div className="text-xs font-medium text-muted-foreground mb-1">Supporting Character</div>
                                      <div className="font-medium">{job.movie_info.characters.supporting.name || 'Not Available'}</div>
                                      <div className="text-sm text-muted-foreground">{job.movie_info.characters.supporting.gender || 'Not Available'}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        ) : section.key === 'characters' ? (
                          <div className="space-y-4">
                            {(() => {
                              try {
                                return (
                                  <>
                                    {job.characters?.lead && <CharacterCard characterKey="lead" characterInfo={job.characters.lead} characterTitle={t('leadCharacter')} />}
                                    {job.characters?.supporting && <CharacterCard characterKey="supporting" characterInfo={job.characters.supporting} characterTitle={t('supportingCharacter')} />}
                                  </>
                                );
                              } catch (error) {
                                console.error('Error rendering characters:', error);
                                return (
                                  <div className="text-center text-muted-foreground p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                                    <p className="text-destructive mb-2">Error loading characters section</p>
                                    <p className="text-xs">Please try refreshing the page</p>
                                  </div>
                                );
                              }
                            })()}
                          </div>
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
        <SystemAlertDialog
          open={showEditWarning}
          onOpenChange={setShowEditWarning}
          title={t('warningEditImpact')}
          cancelLabel={t('discardChanges')}
          actions={[
            {
              label: t('editAndDeleteProgressiveData'),
              onClick: () => handleEditWarningAction('delete'),
              variant: 'destructive'
            },
            {
              label: t('overrideMyResponsibility'),
              onClick: () => handleEditWarningAction('override'),
              className: 'bg-amber-600 hover:bg-amber-700'
            }
          ]}
          allowClickOutside={true}
        >
          <div className="space-y-3">
            <p className="break-words">{t('editingSectionMayAffect')}</p>
            
            {pendingEdit?.affectedSections && pendingEdit.affectedSections.length > 0 && (
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm font-medium text-destructive mb-2 break-words">
                  {t('affectedSections')}:
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {pendingEdit.affectedSections.map(sectionKey => {
                    const section = SECTIONS.find(s => s.key === sectionKey);
                    return (
                      <Badge key={sectionKey} variant="destructive" className="text-xs break-words">
                        {section ? section.title : sectionKey}
                      </Badge>
                    );
                  })}
                </div>
                {job && (
                  <div className="space-y-1">
                    {pendingEdit.affectedSections.map(sectionKey => {
                      const timestamp = job[`${sectionKey}_updated_at` as keyof StoryboardJob] as string | null;
                      const section = SECTIONS.find(s => s.key === sectionKey);
                      return timestamp ? (
                        <div key={sectionKey} className="text-xs text-destructive/80 break-words">
                          {section?.title}: {new Date(timestamp).toLocaleString()}
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}
            
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <p className="text-sm font-medium text-amber-300 break-words">
                {t('whatWouldYouLikeToDo')}
              </p>
            </div>
          </div>
        </SystemAlertDialog>

        {/* Regenerate Confirmation Dialog */}
        <SystemAlertDialog
          open={showRegenerateWarning}
          onOpenChange={setShowRegenerateWarning}
          title={t('regenerate')}
          description={t('regenerateConfirmation')}
          cancelLabel={t('cancel')}
          actions={[
            {
              label: 'OK',
              onClick: async () => {
                setShowRegenerateWarning(false);
                try {
                  await handleGenerate('movie_info');
                } catch (error) {
                  console.error('❌ Error regenerating movie info:', error);
                  toast({
                    title: "Error",
                    description: "Failed to regenerate movie information",
                    variant: "destructive"
                  });
                }
              },
              variant: 'destructive'
            }
          ]}
          allowClickOutside={true}
          iconVariant="warning"
        />

        {/* Delete Confirmation Dialog */}
        <SystemAlertDialog
          open={showDeleteWarning}
          onOpenChange={setShowDeleteWarning}
          title="Delete Section"
          description="Deleting this section will remove all data from this section and all following sections. This action cannot be undone."
          cancelLabel={t('cancel')}
          actions={[
            {
              label: "Delete",
              onClick: confirmDeleteSection,
              variant: "destructive"
            }
          ]}
          allowClickOutside={true}
          iconVariant="warning"
        >
          {pendingDelete && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sections to be deleted:
              </p>
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <ul className="text-sm space-y-1">
                  {pendingDelete.affectedSections.map(sectionKey => {
                    const section = SECTIONS.find(sec => sec.key === sectionKey);
                    return (
                      <li key={sectionKey} className="flex items-center gap-2">
                        {section?.icon && <section.icon className="h-4 w-4" />}
                        {section?.title || sectionKey}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </SystemAlertDialog>
      </div>
    </div>
  );
}
