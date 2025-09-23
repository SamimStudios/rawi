import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Copy, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useNodeLibrary } from '@/hooks/useNodeLibrary';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function NodeLibraryList() {
  const { entries, loading, fetchEntries, deleteEntry } = useNodeLibrary();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || entry.node_type === filterType;
    const matchesActive = filterActive === 'all' || 
      (filterActive === 'active' && entry.active) ||
      (filterActive === 'inactive' && !entry.active);
    
    return matchesSearch && matchesType && matchesActive;
  });

  const handleDelete = async (id: string) => {
    const success = await deleteEntry(id);
    if (success) {
      toast({
        title: "Success",
        description: "Node library entry deleted successfully",
      });
    }
  };

  const handleClone = (entry: any) => {
    navigate(`/app/build/node/new?clone=${encodeURIComponent(entry.id)}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading node library...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Node Library</h1>
          <p className="text-muted-foreground">
            Manage reusable node definitions for your application
          </p>
        </div>
        
        <Button asChild>
          <Link to="/app/build/node/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Node
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
                placeholder="Search by node ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="form">Form</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="group">Group</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Node Library Entries ({filteredEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {entries.length === 0 ? 'No node library entries found.' : 'No entries match your filters.'}
              </p>
              <Button asChild className="mt-4">
                <Link to="/app/build/node/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Node
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>N8N Integration</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {entry.node_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.active ? "default" : "secondary"}>
                          {entry.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.version}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {entry.validate_n8n_id && (
                            <Badge variant="outline" className="text-xs">
                              Validate
                            </Badge>
                          )}
                          {entry.generate_n8n_id && (
                            <Badge variant="outline" className="text-xs">
                              Generate
                            </Badge>
                          )}
                          {!entry.validate_n8n_id && !entry.generate_n8n_id && (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.updated_at ? new Date(entry.updated_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClone(entry)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/app/build/node/${entry.id}`}>
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
                                <AlertDialogTitle>Delete Node Library Entry</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{entry.id}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(entry.id)}
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
    </div>
  );
}