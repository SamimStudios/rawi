import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Film,
  Users,
  Target,
  Play,
  Music,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useGuestSession } from '@/hooks/useGuestSession';
import { EditButton } from '@/components/ui/edit-button';
import { cn } from '@/lib/utils';
import { StoryboardFormSection } from '@/components/storyboard/StoryboardFormSection';

// Progressive section configuration
const getSections = (t: any) => [
  {
    key: 'movie_info',
    title: t('movieInformation'),
    icon: Film,
    generateFunctionId: 'generate-movie-info',
    editFunctionId: 'edit-movie-info',
    nextButton: t('generateCharacters'),
    fields: ['title', 'logline', 'world', 'look']
  },
  {
    key: 'characters', 
    title: t('characters'),
    icon: Users,
    generateFunctionId: null,
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
  result_data?: any;
  created_at: string;
  updated_at: string;
  user_input_updated_at?: string;
  movie_info_updated_at?: string;
  characters_updated_at?: string;
  props_updated_at?: string;
  timeline_updated_at?: string;
  music_updated_at?: string;
  user_id?: string;
  session_id?: string;
}

interface FunctionData {
  id: string;
  name: string;
  price: number;
}

export default function StoryboardWorkspace() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
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
  
  const [job, setJob] = useState<StoryboardJob | null>(null);
  const [functions, setFunctions] = useState<Record<string, FunctionData>>({});
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Array<{id: string, name: string, description: string}>>([]);
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    input: false
  });
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});
  const [loadingSections, setLoadingSections] = useState<Record<string, boolean>>({});

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('storyboard_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

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

      setJob(data as StoryboardJob);
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

  const handleEditToggle = (section: string) => {
    setEditingSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (jobId) {
      fetchJob();
      fetchTemplates();
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

  const isAnyEditMode = Object.values(editingSections).some(Boolean);
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
                {job.user_input_updated_at ? (
                  <div className="text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(job.user_input_updated_at).toLocaleString()}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {t('lastUpdated')}: {t('notAvailable')}
                  </div>
                )}
                <EditButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditToggle('input');
                  }}
                  disabled={isAnyEditMode && !editingSections.input}
                  isEditing={editingSections.input}
                />
              </div>
            </div>
          </CardHeader>
          
          {openSections.input && (
            <CardContent className="space-y-4">
              {editingSections.input ? (
                <StoryboardFormSection
                  initialData={job.user_input}
                  onSave={async (formData) => {
                    try {
                      const { error } = await supabase
                        .from('storyboard_jobs')
                        .update({ 
                          user_input: formData
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
                  }}
                  saveButtonText={t('save')}
                  disabled={false}
                />
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">{t('viewingStoredUserInput')}</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Progressive Sections - Placeholder for now */}
        {SECTIONS.map((section) => (
          <Card key={section.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="h-5 w-5" />
                {section.title}
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('sectionPlaceholder')}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}