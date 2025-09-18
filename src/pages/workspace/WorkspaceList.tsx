import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useVideoJobs } from '@/hooks/useVideoJobs';
import { Link } from 'react-router-dom';
import { Calendar, Settings, Eye } from 'lucide-react';

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

export default function WorkspaceList() {
  const { jobs, loading, error } = useVideoJobs();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Workspace</h1>
        <p className="text-muted-foreground">
          Manage your video jobs and their associated nodes
        </p>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No jobs found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg truncate">
                    {job.template_key || 'Untitled Job'}
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(job.status)}
                  >
                    {job.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Updated: {new Date(job.updated_at).toLocaleDateString()}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Credits Used:</span> {job.credits_used}
                    </div>
                    <div className="text-sm ">
                      <span className="font-medium">Watermark:</span> {job.watermark ? 'Yes' : 'No'}
                    </div>
                    {job.node_index && Array.isArray(job.node_index) && (
                      <div className="text-sm">
                        <span className="font-medium">Nodes:</span> {job.node_index.length}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link to={`/workspace/${job.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}