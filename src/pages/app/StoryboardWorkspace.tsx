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
  const [movieInfoOpen, setMovieInfoOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [movieData, setMovieData] = useState({
    title: '',
    logline: '',
    world: '',
    look: ''
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
      
    } catch (error) {
      console.error('Error in fetchJob:', error);
      toast.error(t('An unexpected error occurred'));
      navigate('/app/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
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
    // TODO: Implement save function - user will specify this later
    console.log('Save movie data:', movieData);
    toast.success(t('Movie information saved'));
    setIsEditing(false);
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
          <Button onClick={() => navigate('/app/dashboard')}>
            {t('Back to Dashboard')}
          </Button>
        </div>
      </div>
    );
  }

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
            variant="outline" 
            onClick={() => navigate('/app/dashboard')}
          >
            {t('Back to Dashboard')}
          </Button>
        </div>

        {/* Basic Job Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Job Information')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('Lead Character')}</label>
                <p className="text-sm">{job.user_input?.leadName || t('Not specified')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('Gender')}</label>
                <p className="text-sm">{job.user_input?.leadGender || t('Not specified')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('Language')}</label>
                <p className="text-sm">{job.user_input?.language || t('Not specified')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('Accent')}</label>
                <p className="text-sm">{job.user_input?.accent || t('Not specified')}</p>
              </div>
            </div>
            {job.user_input?.genres && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('Genres')}</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {job.user_input.genres.map((genre: string) => (
                    <Badge key={genre} variant="secondary">{genre}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Movie Information Section */}
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
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerate();
                      }}
                    >
                      {t('Generate')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
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
                      <Button onClick={handleSave} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        {t('Save')}
                      </Button>
                      <Button onClick={handleEditToggle} variant="outline" size="sm">
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

        {/* Other sections will be added later */}
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
      </div>
    </div>
  );
}
