import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useVideoJob } from '@/hooks/useVideoJobs';
import { useWorkspaceNodes } from '@/hooks/useWorkspaceNodes';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Settings, RefreshCw } from 'lucide-react';
import NodeRenderer from '@/components/workspace/NodeRenderer';

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'in_progress':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'draft':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'archived':
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  }
};

export default function WorkspaceJob() {
  const { jobId } = useParams<{ jobId: string }>();
  const { job, loading: jobLoading, error: jobError } = useVideoJob(jobId!);
  const { nodes, loading: nodesLoading, error: nodesError, refetch: refetchNodes } = useWorkspaceNodes(jobId!);

  if (jobLoading || nodesLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (jobError || nodesError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error: {jobError || nodesError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Job not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/workspace">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Workspace
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{job.template_key || 'Untitled Job'}</h1>
            <p className="text-muted-foreground">Job ID: {job.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={getStatusColor(job.status)}
          >
            {job.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={refetchNodes}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Job Details */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
              <p className="text-sm">{job.status}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Credits Used</h4>
              <p className="text-sm">{job.credits_used}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Watermark</h4>
              <p className="text-sm">{job.watermark ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Last Updated</h4>
              <p className="text-sm">{new Date(job.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nodes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Nodes ({nodes.length})</h2>
        </div>

        {nodes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No nodes found for this job.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {nodes.map((node) => (
              <NodeRenderer key={node.id} node={node} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}