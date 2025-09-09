import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Edit2, Save, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';

interface StoryboardJob {
  id: string;
  user_input: any;
  movie_info: any;
  status: string;
  stage: string;
  result_data: any;
  n8n_response: any;
  created_at: string;
}

export default function StoryboardWorkspace() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { sessionId } = useGuestSession();
  
  const [job, setJob] = useState<StoryboardJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobInfoOpen, setJobInfoOpen] = useState(false); // Collapsed by default
  const [movieInfoOpen, setMovieInfoOpen] = useState(false); // Collapsed by default
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingJobInfo, setIsEditingJobInfo] = useState(false);
  const [movieData, setMovieData] = useState({
    title: '',
    logline: '',
    world: '',
    look: ''
  });
  const [jobInputData, setJobInputData] = useState({
    leadName: '',
    leadGender: '',
    language: '',
    accent: '',
    size: '',
    prompt: '',
    genres: [] as string[]
  });

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
      
      // Initialize job input data
      if (data.user_input && typeof data.user_input === 'object') {
        const userInput = data.user_input as any;
        setJobInputData({
          leadName: userInput.leadName || '',
          leadGender: userInput.leadGender || '',
          language: userInput.language || '',
          accent: userInput.accent || '',
          size: userInput.size || '',
          prompt: userInput.prompt || '',
          genres: userInput.genres || []
        });
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
      const { error } = await supabase
        .from('storyboard_jobs')
        .update({ 
          user_input: jobInputData,
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
        setJobInputData({
          leadName: userInput.leadName || '',
          leadGender: userInput.leadGender || '',
          language: userInput.language || '',
          accent: userInput.accent || '',
          size: userInput.size || '',
          prompt: userInput.prompt || '',
          genres: userInput.genres || []
        });
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
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">{t('Lead Character')}</label>
                        <Input
                          value={jobInputData.leadName}
                          onChange={(e) => setJobInputData({ ...jobInputData, leadName: e.target.value })}
                          placeholder={t('Enter lead character name')}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t('Gender')}</label>
                        <Input
                          value={jobInputData.leadGender}
                          onChange={(e) => setJobInputData({ ...jobInputData, leadGender: e.target.value })}
                          placeholder={t('Enter gender')}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t('Language')}</label>
                        <Input
                          value={jobInputData.language}
                          onChange={(e) => setJobInputData({ ...jobInputData, language: e.target.value })}
                          placeholder={t('Enter language')}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t('Accent')}</label>
                        <Input
                          value={jobInputData.accent}
                          onChange={(e) => setJobInputData({ ...jobInputData, accent: e.target.value })}
                          placeholder={t('Enter accent')}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t('Size')}</label>
                        <Input
                          value={jobInputData.size}
                          onChange={(e) => setJobInputData({ ...jobInputData, size: e.target.value })}
                          placeholder={t('Enter size')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('Prompt')}</label>
                      <Textarea
                        value={jobInputData.prompt}
                        onChange={(e) => setJobInputData({ ...jobInputData, prompt: e.target.value })}
                        placeholder={t('Enter prompt')}
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('Genres')}</label>
                      <Input
                        value={jobInputData.genres.join(', ')}
                        onChange={(e) => setJobInputData({ ...jobInputData, genres: e.target.value.split(',').map(g => g.trim()).filter(g => g) })}
                        placeholder={t('Enter genres separated by commas')}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSaveJobInfo} variant="type_2_blue" size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        {t('Save')}
                      </Button>
                      <Button onClick={handleEditJobInfoToggle} variant="type_3_blue" size="sm">
                        {t('Cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Read-only Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('Lead Character')}</label>
                        <p className="text-sm">{jobInputData.leadName || t('Not specified')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('Gender')}</label>
                        <p className="text-sm">{jobInputData.leadGender || t('Not specified')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('Language')}</label>
                        <p className="text-sm">{jobInputData.language || t('Not specified')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('Accent')}</label>
                        <p className="text-sm">{jobInputData.accent || t('Not specified')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('Size')}</label>
                        <p className="text-sm">{jobInputData.size || t('Not specified')}</p>
                      </div>
                    </div>
                    {jobInputData.prompt && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('Prompt')}</label>
                        <p className="text-sm whitespace-pre-wrap">{jobInputData.prompt}</p>
                      </div>
                    )}
                    {jobInputData.genres.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('Genres')}</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {jobInputData.genres.map((genre: string) => (
                            <Badge key={genre} variant="secondary">{genre}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {(job as any)?.input_updated_at && (
                      <div className="text-xs text-muted-foreground">
                        {t('Last updated')}: {new Date((job as any).input_updated_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Movie Information Section - Locked until first generation */}
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
                    {firstGenerated && (
                      <Button
                        size="sm"
                        variant="type_2_blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerate();
                        }}
                      >
                        {t('Regenerate')}
                      </Button>
                    )}
                    {firstGenerated && (
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
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {!firstGenerated ? (
                  // Locked state
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t('Complete first generation to view/edit details')}</p>
                  </div>
                ) : isEditing ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">{t('Movie Title')}</label>
                      <Input
                        value={movieData.title}
                        onChange={(e) => setMovieData({ ...movieData, title: e.target.value })}
                        placeholder={t('Enter movie title')}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('Movie Plot (Logline)')}</label>
                      <Textarea
                        value={movieData.logline}
                        onChange={(e) => setMovieData({ ...movieData, logline: e.target.value })}
                        placeholder={t('Enter movie plot/logline')}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('World')}</label>
                      <Input
                        value={movieData.world}
                        onChange={(e) => setMovieData({ ...movieData, world: e.target.value })}
                        placeholder={t('Enter world setting')}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('Look')}</label>
                      <Input
                        value={movieData.look}
                        onChange={(e) => setMovieData({ ...movieData, look: e.target.value })}
                        placeholder={t('Enter visual style/look')}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSave} variant="type_2_blue" size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        {t('Save')}
                      </Button>
                      <Button onClick={handleEditToggle} variant="type_3_blue" size="sm">
                        {t('Cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Read-only Mode
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('Movie Title')}</label>
                      <p className="text-sm mt-1">{movieData.title || t('Not specified')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('Movie Plot (Logline)')}</label>
                      <p className="text-sm mt-1">{movieData.logline || t('Not specified')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('World')}</label>
                      <p className="text-sm mt-1">{movieData.world || t('Not specified')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('Look')}</label>
                      <p className="text-sm mt-1">{movieData.look || t('Not specified')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Other sections - only show after first generation */}
        {firstGenerated && (
          <>
            <Card>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4" />
                      {t('Character Development')}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <p className="text-muted-foreground">{t('Character development section - coming soon')}</p>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            <Card>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4" />
                      {t('Scene Planning')}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <p className="text-muted-foreground">{t('Scene planning section - coming soon')}</p>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
