import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Copy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTemplates } from '@/hooks/useTemplates';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function TemplateList() {
  const { templates, loading, fetchTemplates, deleteTemplate, cloneTemplate } = useTemplates();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneData, setCloneData] = useState<{originalId: string; newId: string; newName: string}>({
    originalId: '',
    newId: '',
    newName: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    const matchesActive = filterActive === 'all';
    
    return matchesSearch && matchesCategory && matchesActive;
  });

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const handleDelete = async (id: string) => {
    const success = await deleteTemplate(id);
    if (success) {
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    }
  };

  const handleClone = (template: any) => {
    setCloneData({
      originalId: template.id,
      newId: '',
      newName: `${template.name} (Copy)`,
    });
    setCloneDialogOpen(true);
  };

  const handleCloneConfirm = async () => {
    if (!cloneData.newId.trim() || !cloneData.newName.trim()) {
      toast({
        title: "Validation Error",
        description: "Template ID and name are required",
        variant: "destructive",
      });
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cloneData.newId)) {
      toast({
        title: "Validation Error",
        description: "Template ID can only contain letters, numbers, underscores, and hyphens",
        variant: "destructive",
      });
      return;
    }

    if (templates.some(t => t.id === cloneData.newId)) {
      toast({
        title: "Validation Error",
        description: "Template ID already exists",
        variant: "destructive",
      });
      return;
    }

    const success = await cloneTemplate(cloneData.originalId, cloneData.newId, cloneData.newName);
    if (success) {
      setCloneDialogOpen(false);
      setCloneData({ originalId: '', newId: '', newName: '' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading templates...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            Manage reusable templates for your application
          </p>
        </div>
        
        <Button asChild>
          <Link to="/app/build/template/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by ID or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Templates ({filteredTemplates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {templates.length === 0 ? 'No templates found.' : 'No templates match your filters.'}
              </p>
              <Button asChild className="mt-4">
                <Link to="/app/build/template/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Template
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                     <TableHead>Type</TableHead>
                     <TableHead>Description</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        {template.id}
                      </TableCell>
                      <TableCell>{template.name}</TableCell>
                       <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {template.category.split('_').join(' ')}
                        </Badge>
                       </TableCell>
                       <TableCell className="text-sm text-muted-foreground">
                         Version {template.current_version}
                       </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {template.updated_at ? new Date(template.updated_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClone(template)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/app/build/template/${template.id}`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{template.name}"? This action cannot be undone and will also delete all associated template nodes.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(template.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clone Dialog */}
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Template</DialogTitle>
            <DialogDescription>
              Create a copy of this template with a new ID and name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newId">New Template ID</Label>
              <Input
                id="newId"
                value={cloneData.newId}
                onChange={(e) => setCloneData(prev => ({ ...prev, newId: e.target.value }))}
                placeholder="new-template-id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newName">New Template Name</Label>
              <Input
                id="newName"
                value={cloneData.newName}
                onChange={(e) => setCloneData(prev => ({ ...prev, newName: e.target.value }))}
                placeholder="New Template Name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCloneConfirm}>
              Clone Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}