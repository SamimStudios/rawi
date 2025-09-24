import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '@/hooks/useTemplates';
import { useJobs } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Play, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AppTemplates() {
  const navigate = useNavigate();
  const { templates, loading, fetchTemplates } = useTemplates();
  const { createJobFromTemplate, loading: jobLoading } = useJobs();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [jobName, setJobName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateJob = async () => {
    if (!selectedTemplate || !jobName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a job name",
        variant: "destructive",
      });
      return;
    }

    const jobId = await createJobFromTemplate(selectedTemplate, jobName.trim());
    if (jobId) {
      setDialogOpen(false);
      setJobName('');
      setSelectedTemplate(null);
      navigate(`/app/jobs/edit/${jobId}`);
    }
  };

  const openCreateDialog = (templateId: string) => {
    setSelectedTemplate(templateId);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Templates</h1>
        <p className="text-muted-foreground">
          Choose a template to create a new job. Templates provide the structure and fields you need to generate content.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="group hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">
                    Template ID: {template.id}
                  </CardDescription>
                </div>
                <Badge variant="outline">{template.type}</Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">                
                {template.description && (
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                )}
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                onClick={() => openCreateDialog(template.id)}
                className="w-full"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Create Job
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm ? 'No templates match your search.' : 'No active templates found.'}
          </p>
        </div>
      )}

      {/* Create Job Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="jobName">Job Name</Label>
              <Input
                id="jobName"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="Enter a name for your job"
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateJob}
                disabled={jobLoading || !jobName.trim()}
              >
                {jobLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Job'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}