import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '@/hooks/useTemplates';
import { useJobs } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Play, Search, ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function AppTemplates() {
  const navigate = useNavigate();
  const { fetchAllTemplates, getTemplateImageUrl } = useTemplates();
  const { createJobFromTemplate, loading: jobLoading } = useJobs();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [jobName, setJobName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await fetchAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const filteredTemplates = templates.filter(template => {
    const search = searchTerm.toLowerCase();
    return (
      template.name.toLowerCase().includes(search) ||
      (template.category || '').toLowerCase().includes(search) ||
      template.id.toLowerCase().includes(search) ||
      (template.active ? 'active' : 'inactive').includes(search)
    );
  });

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, any[]>);

  const handleCreateJob = async () => {
    if (!selectedTemplate || !jobName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a job name",
        variant: "destructive",
      });
      return;
    }

    try {
      console.group('[Templates] ▶ handleCreateJob');
      console.debug('templateId:', selectedTemplate, 'jobName:', jobName);

      // Back-compat call: hook supports (templateId, jobNameString)
      const jobId = await createJobFromTemplate(selectedTemplate, jobName.trim());

      if (jobId) {
        setDialogOpen(false);
        setJobName('');
        setSelectedTemplate(null);
        console.debug('[Templates] → navigate to job:', jobId);
        navigate(`/app/jobs/edit/${jobId}`);
      }
    } catch (e) {
      console.error('[Templates] ❌ failed to create job:', e);
    } finally {
      console.groupEnd();
    }
  };

  const openCreateDialog = (templateId: string) => {
    setSelectedTemplate(templateId);
    setDialogOpen(true);
  };

  const handleGenerateImages = async () => {
    try {
      setGeneratingImages(true);
      let totalProcessed = 0;
      let totalSuccess = 0;
      let totalFailed = 0;
      let offset = 0;
      let hasMore = true;

      toast({
        title: 'Generating Images',
        description: 'Creating template images with AI. This will process in batches...'
      });

      // Process in batches to avoid timeouts
      while (hasMore) {
        const { data, error } = await supabase.functions.invoke('generate-template-images', {
          body: { batch_size: 10, offset }
        });

        if (error) {
          console.error('Batch failed:', error);
          toast({
            title: 'Batch Error',
            description: `Error processing batch at offset ${offset}`,
            variant: 'destructive'
          });
          break;
        }

        if (data) {
          totalProcessed += data.batch_info.processed;
          totalSuccess += data.results.filter((r: any) => r.success).length;
          totalFailed += data.results.filter((r: any) => !r.success).length;
          hasMore = data.batch_info.has_more;
          offset = data.batch_info.next_offset || 0;

          toast({
            title: 'Batch Complete',
            description: `Processed ${totalProcessed} templates so far (${totalSuccess} succeeded, ${totalFailed} failed)`
          });
        }

        if (!hasMore) break;
      }

      toast({
        title: 'Generation Complete',
        description: `Generated images for ${totalSuccess} templates (${totalFailed} failed)`
      });

      // Reload templates to show new images
      await loadTemplates();
    } catch (error) {
      console.error('Failed to generate images:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate template images',
        variant: 'destructive'
      });
    } finally {
      setGeneratingImages(false);
    }
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
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold">Templates</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mt-2">
              Choose a template to create a new job. Templates provide the structure and fields you need to generate content.
            </p>
          </div>
          
          <Button
            onClick={handleGenerateImages}
            disabled={generatingImages}
            variant="outline"
            className="gap-2"
          >
            {generatingImages ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImagePlus className="w-4 h-4" />
                Generate Images
              </>
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Templates Grid - Grouped by Category */}
      {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
        <div key={category} className="mb-12">
          <h2 className="text-2xl font-bold mb-6 px-2">{category}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {(categoryTemplates as any[]).map((template) => (
              <Card 
                key={template.id} 
                className={`group relative overflow-hidden transition-all duration-300 cursor-pointer ${
                  template.active 
                    ? 'hover:scale-105 hover:shadow-2xl' 
                    : 'opacity-75'
                }`}
              >
                {/* Image Container - 16:9 aspect ratio */}
                <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
                  {/* Template Image */}
                  <img 
                    src={getTemplateImageUrl(template.id)}
                    alt={template.name}
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      template.active 
                        ? 'filter-none group-hover:scale-110' 
                        : 'grayscale'
                    }`}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  
                  {/* Inactive Badge */}
                  {!template.active && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-black/60 text-white border-white/20">
                        Inactive
                      </Badge>
                    </div>
                  )}
                  
                  {/* Template Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white space-y-2">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {template.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className="text-xs border-white/40 text-white bg-black/30"
                      >
                        v{template.current_version}
                      </Badge>
                      
                      {template.active && (
                        <Badge 
                          variant="default" 
                          className="text-xs bg-green-600/80 border-green-400/50"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Button - ONLY for active templates */}
                {template.active && (
                  <CardFooter className="p-3 bg-card">
                    <Button 
                      onClick={() => openCreateDialog(template.id)}
                      className="w-full group-hover:scale-105 transition-all"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Create Job
                    </Button>
                  </CardFooter>
                )}
                
                {/* Coming Soon footer for inactive */}
                {!template.active && (
                  <div className="p-3 bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">Coming Soon</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(groupedTemplates).length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm ? 'No templates match your search.' : 'No templates found.'}
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
