import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';
import { CheckCircle, Clock, AlertCircle, XCircle, RotateCcw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StoryboardJob {
  id: string;
  status: string;
  stage: string;
  user_input: any;
  result_data: any;
  n8n_webhook_sent: boolean;
  n8n_response: any;
  created_at: string;
  updated_at: string;
}

export default function StoryboardJobStatus() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { sessionId } = useGuestSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<StoryboardJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const fetchJob = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('storyboard_jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching job:', error);
        toast({
          title: "Error",
          description: "Failed to fetch job status",
          variant: "destructive"
        });
        return;
      }

      setJob(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    
    // Auto-refresh every 5 seconds if job is pending or processing
    const interval = setInterval(() => {
      if (job && (job.status === 'pending' || job.stage === 'processing')) {
        fetchJob();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, job?.status, job?.stage]);

  const handleRetry = async () => {
    if (!job) return;
    
    setRetrying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('retry-storyboard-job', {
        body: { jobId: job.id }
      });

      if (error) {
        console.error('Error retrying job:', error);
        toast({
          title: "Retry Failed",
          description: error.message || "Failed to retry the job. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Job Retried!",
        description: "Your storyboard job has been restarted."
      });

      // Refresh job data
      await fetchJob();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRetrying(false);
    }
  };

  const getStatusIcon = (job: StoryboardJob) => {
    if (job.status === 'failed' || (job.n8n_response && job.n8n_response.error)) {
      return <XCircle className="w-6 h-6 text-red-500" />;
    }
    
    switch (job.stage) {
      case 'created':
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusBadge = (job: StoryboardJob) => {
    if (job.status === 'failed' || (job.n8n_response && job.n8n_response.error)) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    
    switch (job.stage) {
      case 'created':
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge variant="default">Processing</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const isJobFailed = (job: StoryboardJob) => {
    return job.status === 'failed' || 
           job.stage === 'failed' || 
           (job.n8n_response && job.n8n_response.error) ||
           (!job.n8n_webhook_sent && new Date(job.created_at) < new Date(Date.now() - 5 * 60 * 1000)); // 5 minutes timeout
  };

  const getStatusDescription = (job: StoryboardJob) => {
    if (job.status === 'failed' || job.stage === 'failed') {
      return 'Job failed to complete';
    }
    
    if (job.n8n_response && job.n8n_response.error) {
      return `Webhook failed: ${job.n8n_response.error}`;
    }
    
    if (!job.n8n_webhook_sent && new Date(job.created_at) < new Date(Date.now() - 5 * 60 * 1000)) {
      return 'Job timed out - webhook was not sent successfully';
    }
    
    switch (job.stage) {
      case 'created':
        return 'Job has been created and queued for processing';
      case 'pending':
        return 'Job is waiting to be processed';
      case 'processing':
        return 'Your storyboard is being generated';
      case 'completed':
        return 'Storyboard generation completed successfully!';
      default:
        return 'Processing your storyboard...';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Job not found</p>
            <Button onClick={() => navigate('/app/storyboard')}>
              Create New Storyboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getStatusIcon(job)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span>Storyboard Job</span>
                {getStatusBadge(job)}
              </div>
              <p className="text-sm text-muted-foreground font-normal">
                {getStatusDescription(job)}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Details */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Job ID:</span>
                <p className="font-mono text-xs mt-1">{job.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="mt-1">{new Date(job.created_at).toLocaleString()}</p>
              </div>
            </div>
            
            {/* User Input Summary */}
            {job.user_input && (
              <div>
                <span className="text-muted-foreground text-sm">Input:</span>
                <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                  <p><strong>Lead:</strong> {job.user_input.lead_name} ({job.user_input.lead_gender})</p>
                  <p><strong>Language:</strong> {job.user_input.language} ({job.user_input.accent})</p>
                  <p><strong>Genres:</strong> {job.user_input.genres?.join(', ')}</p>
                  {job.user_input.prompt && (
                    <p><strong>Prompt:</strong> {job.user_input.prompt}</p>
                  )}
                </div>
              </div>
            )}

            {/* Error Details */}
            {job.n8n_response && job.n8n_response.error && (
              <div>
                <span className="text-muted-foreground text-sm">Error Details:</span>
                <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
                  <p className="text-destructive">{job.n8n_response.error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Auto-refresh indicator */}
          {(job.status === 'pending' || job.stage === 'processing') && (
            <div className="text-sm text-muted-foreground italic text-center">
              Auto-refreshing every 5 seconds...
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isJobFailed(job) && (
              <Button 
                onClick={handleRetry}
                disabled={retrying}
                className="flex-1"
              >
                {retrying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                )}
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => navigate('/app/storyboard')}
              className={isJobFailed(job) ? 'flex-1' : 'w-full'}
            >
              Create New Storyboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}