import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { History as HistoryIcon } from 'lucide-react';

interface StoryboardJob {
  id: string;
  user_input: any;
  status: string;
  stage: string;
  created_at: string;
  updated_at: string;
  result_data?: any;
  n8n_response?: any;
  movie_info?: any;
  characters?: any;
  props?: any;
  timeline?: any;
  music?: any;
  input_updated_at?: string;
  movie_info_updated_at?: string;
  characters_updated_at?: string;
  props_updated_at?: string;
  timeline_updated_at?: string;
  music_updated_at?: string;
  user_id?: string;
  session_id?: string;
  n8n_webhook_sent?: boolean;
}

const History = () => {
  const { user, loading } = useAuth();
  const { sessionId } = useGuestSession();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<StoryboardJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user && !sessionId) {
      navigate('/auth/sign-in');
    }
  }, [user, loading, sessionId, navigate]);

  useEffect(() => {
    if ((user || sessionId) && !loading) {
      fetchJobs();
    }
  }, [user, sessionId, loading]);

  const fetchJobs = async () => {
    try {
      setJobsLoading(true);
      
      let query = supabase
        .from('storyboard_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (user) {
        query = query.eq('user_id', user.id);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId).is('user_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching jobs:', error);
        return;
      }

      setJobs((data || []) as StoryboardJob[]);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  if (loading || jobsLoading) {
    return (
      <div className="min-h-screen bg-[#0F1320] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user && !sessionId) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
      pending: 'secondary',
      created: 'secondary'
    };

    const labels: Record<string, string> = {
      completed: t('statusSuccess'),
      processing: t('statusRunning'),
      failed: t('statusFailed'),
      pending: t('statusQueued'),
      created: t('statusQueued')
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const isJobCompleted = (job: StoryboardJob): boolean => {
    return job.status === 'completed' || 
           (job.result_data && Object.keys(job.result_data).length > 0) ||
           job.status === 'success';
  };

  const getJobTitle = (job: StoryboardJob): string => {
    // Handle new nested format
    if (job.user_input?.characters?.lead?.name) {
      return `${job.user_input.characters.lead.name} Storyboard`;
    }
    // Handle old format for backward compatibility
    if (job.user_input?.leadName || job.user_input?.lead_name) {
      return `${job.user_input.leadName || job.user_input.lead_name} Storyboard`;
    }
    return `Storyboard ${job.id.slice(0, 8)}`;
  };

  const handleViewJob = (job: StoryboardJob) => {
    if (isJobCompleted(job)) {
      // Navigate to results page if available, otherwise to workspace
      navigate(`/app/storyboard/${job.id}`);
    } else {
      // Navigate to workspace for in-progress jobs
      navigate(`/app/storyboard/${job.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1320]">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <HistoryIcon className="w-8 h-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {t('myHistory')}
              </h1>
            </div>
          </div>

          {/* History Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{t('myHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('No storyboards found')}</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => navigate('/app/storyboard-playground')}
                  >
                    {t('Create Your First Storyboard')}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground">{t('title')}</TableHead>
                      <TableHead className="text-foreground">{t('date')}</TableHead>
                      <TableHead className="text-foreground">{t('status')}</TableHead>
                      <TableHead className="text-foreground">{t('result')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="text-foreground font-medium">
                          {getJobTitle(job)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(job.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(job.status)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-primary border-primary hover:bg-primary/10"
                            onClick={() => handleViewJob(job)}
                          >
                            {isJobCompleted(job) ? t('viewResult') : t('View Progress')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default History;