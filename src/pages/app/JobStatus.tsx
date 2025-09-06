import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, Clock, AlertCircle, XCircle, Play, RotateCcw, HelpCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type JobStatus = 'queued' | 'running' | 'success' | 'failed';

interface JobData {
  id: string;
  templateName: string;
  status: JobStatus;
  progress: number;
  logs: string[];
  resultId?: string;
  isGuest: boolean;
}

const JobStatus = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobData | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/sign-in');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Mock job data - replace with API call later
    const mockJob: JobData = {
      id: id || 'mock-id',
      templateName: 'Cinematic Action Trailer',
      status: 'running', // Change this to test different states
      progress: 65,
      logs: [
        'Processing character detection...',
        'Generating cinematic shots...',
        'Applying visual effects...'
      ],
      resultId: 'result-123',
      isGuest: !user
    };
    setJob(mockJob);
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1320] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#0F1320] flex items-center justify-center">
        <div className="text-white">Job not found</div>
      </div>
    );
  }

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'queued':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'running':
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
    }
  };

  const getStatusBadge = (status: JobStatus) => {
    const variants: Record<JobStatus, 'default' | 'secondary' | 'destructive'> = {
      queued: 'secondary',
      running: 'default',
      success: 'default',
      failed: 'destructive'
    };

    return (
      <Badge variant={variants[status]}>
        {t(`status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
      </Badge>
    );
  };

  const getStatusDescription = (status: JobStatus) => {
    return t(`status${status.charAt(0).toUpperCase() + status.slice(1)}Desc`);
  };

  return (
    <div className="min-h-screen bg-[#0F1320]">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('generationStatus')}
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 text-muted-foreground">
              <span>{t('jobId')}: {job.id}</span>
              <span>{t('templateName')}: {job.templateName}</span>
            </div>
          </div>

          {/* Status Card */}
          <Card className="bg-card border-border mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-foreground">
                {getStatusIcon(job.status)}
                <span>{getStatusDescription(job.status)}</span>
                {getStatusBadge(job.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              {job.status === 'running' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-gradient-auth h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Logs */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Processing Log</h4>
                <div className="bg-background/50 rounded-lg p-4 space-y-1 text-sm text-muted-foreground max-h-32 overflow-y-auto">
                  {job.logs.map((log, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full flex-shrink-0" />
                      {log}
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto-refresh indicator */}
              <div className="text-sm text-muted-foreground italic">
                {t('autoRefreshing')}
              </div>
            </CardContent>
          </Card>

          {/* Guest Note */}
          {job.isGuest && (
            <Card className="bg-yellow-500/10 border-yellow-500/20 mb-8">
              <CardContent className="pt-6">
                <div className="text-yellow-500 text-center">
                  {t('guestNote')}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="bg-gradient-auth hover:opacity-90 text-white border-0 flex-1"
              disabled={job.status !== 'success'}
              asChild={job.status === 'success'}
            >
              {job.status === 'success' ? (
                <Link to={`/app/results/${job.resultId}`} className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  {t('openResult')}
                </Link>
              ) : (
                <span className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  {t('openResult')}
                </span>
              )}
            </Button>

            <Button 
              variant="outline"
              className="text-primary border-primary hover:bg-primary/10 flex-1"
              onClick={() => toast.info('Try again functionality coming soon')}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              {t('tryAgain')}
            </Button>

            <Button 
              variant="outline"
              className="text-primary border-primary hover:bg-primary/10"
              asChild
            >
              <Link to="/help">
                <HelpCircle className="w-5 h-5 mr-2" />
                {t('help')}
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JobStatus;