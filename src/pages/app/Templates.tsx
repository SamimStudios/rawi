import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '@/hooks/useTemplates';
import { useJobs } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Crown, ChevronRight, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AppTemplates() {
  const navigate = useNavigate();
  const { fetchAllTemplates, getTemplateImageUrl } = useTemplates();
  const { createJobFromTemplate, loading: jobLoading } = useJobs();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [jobName, setJobName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

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

  // Create Active category and other categories
  const activeTemplates = templates.filter(t => t.active);
  const groupedTemplates = templates.reduce((acc, template) => {
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
      const jobId = await createJobFromTemplate(selectedTemplate, jobName.trim());
      if (jobId) {
        setDialogOpen(false);
        setJobName('');
        setSelectedTemplate(null);
        navigate(`/app/jobs/edit/${jobId}`);
      }
    } catch (e) {
      console.error('[Templates] Failed to create job:', e);
    }
  };

  const openCreateDialog = (templateId: string, isActive: boolean) => {
    if (!isActive) {
      toast({
        title: "Coming Soon",
        description: "This template will be available soon!",
        variant: "default",
      });
      return;
    }
    setSelectedTemplate(templateId);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Templates</h1>
        </div>
      </div>

      <div className="pb-8">
        {/* Quick Access Templates - Horizontal Scroll */}
        <div className="px-4 py-6">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {templates.slice(0, 4).map((template) => (
              <button
                key={template.id}
                onClick={() => openCreateDialog(template.id, template.active)}
                className="flex-shrink-0 relative w-36 h-36 rounded-2xl overflow-hidden hover:scale-105 transition-transform"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30" />
                <img 
                  src={getTemplateImageUrl(template.id)}
                  alt={template.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => e.currentTarget.style.opacity = '0'}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Badge */}
                {!template.active && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-primary-foreground text-xs">Hot</Badge>
                  </div>
                )}
                
                {/* Name */}
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-sm font-semibold line-clamp-2">{template.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Active Templates Category */}
        {activeTemplates.length > 0 && (
          <div className="mb-8">
            <div className="px-4 mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Active</h2>
            </div>

            <div className="relative">
              <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
                {activeTemplates.map((template) => (
                  <Card 
                    key={template.id}
                    onClick={() => openCreateDialog(template.id, template.active)}
                    className="flex-shrink-0 w-48 overflow-hidden cursor-pointer hover:scale-[1.02] transition-all bg-card/50 backdrop-blur-sm border-border/50"
                  >
                    <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/10 to-accent/10">
                      <img 
                        src={getTemplateImageUrl(template.id)}
                        alt={template.name}
                        className="w-full h-full object-cover"
                        onError={(e) => e.currentTarget.style.opacity = '0'}
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                      
                      <div className="absolute top-2 left-2">
                        <div className="bg-primary/90 backdrop-blur-sm rounded-lg p-1.5">
                          <Crown className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 space-y-2">
                        <div className="flex gap-1 justify-center">
                          <div className="w-10 h-10 rounded border-2 border-white/30 bg-black/40 backdrop-blur-sm overflow-hidden">
                            <img 
                              src={getTemplateImageUrl(template.id)}
                              alt=""
                              className="w-full h-full object-cover opacity-60"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                        {template.name}
                      </h3>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          v{template.current_version}
                        </Badge>
                        <Badge className="text-xs bg-green-600/20 text-green-400 border-green-600/30">
                          <Zap className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Sections */}
        {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
          <div key={category} className="mb-8">
            {/* Section Header */}
            <div className="px-4 mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{category}</h2>
              <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <span className="text-sm">All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Horizontal Scrolling Cards */}
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
                {(categoryTemplates as any[]).map((template) => (
                  <Card 
                    key={template.id}
                    onClick={() => openCreateDialog(template.id, template.active)}
                    className="flex-shrink-0 w-48 overflow-hidden cursor-pointer hover:scale-[1.02] transition-all bg-card/50 backdrop-blur-sm border-border/50"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/10 to-accent/10">
                      <img 
                        src={getTemplateImageUrl(template.id)}
                        alt={template.name}
                        className="w-full h-full object-cover"
                        onError={(e) => e.currentTarget.style.opacity = '0'}
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                      
                      {/* Premium Badge */}
                      {template.active && (
                        <div className="absolute top-2 left-2">
                          <div className="bg-primary/90 backdrop-blur-sm rounded-lg p-1.5">
                            <Crown className="w-4 h-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}

                      {/* Status Badge */}
                      {!template.active && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            Soon
                          </Badge>
                        </div>
                      )}

                      {/* Before/After Indicator */}
                      <div className="absolute bottom-2 left-2 right-2 space-y-2">
                        {/* Mini Preview (simulating before/after) */}
                        <div className="flex gap-1 justify-center">
                          <div className="w-10 h-10 rounded border-2 border-white/30 bg-black/40 backdrop-blur-sm overflow-hidden">
                            <img 
                              src={getTemplateImageUrl(template.id)}
                              alt=""
                              className="w-full h-full object-cover opacity-60"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="p-3 space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                        {template.name}
                      </h3>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          v{template.current_version}
                        </Badge>
                        {template.active ? (
                          <Badge className="text-xs bg-green-600/20 text-green-400 border-green-600/30">
                            <Zap className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Coming
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {Object.keys(groupedTemplates).length === 0 && (
          <div className="text-center py-12 px-4">
            <p className="text-muted-foreground">No templates found.</p>
          </div>
        )}
      </div>

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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && jobName.trim()) {
                    handleCreateJob();
                  }
                }}
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

      {/* Custom Scrollbar Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
