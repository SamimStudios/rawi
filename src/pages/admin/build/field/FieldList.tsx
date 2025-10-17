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
import { useFields } from '@/hooks/useFields';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function FieldList() {
  const { entries, loading, fetchEntries, deleteEntry } = useFields();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDataType, setFilterDataType] = useState<string>('all');
  const [filterWidget, setFilterWidget] = useState<string>('all');

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDataType = filterDataType === 'all' || entry.datatype === filterDataType;
    const matchesWidget = filterWidget === 'all' || entry.widget === filterWidget;
    
    return matchesSearch && matchesDataType && matchesWidget;
  });

  // Get unique data types and widgets for filter options
  const uniqueDataTypes = [...new Set(entries.map(entry => entry.datatype))];
  const uniqueWidgets = [...new Set(entries.map(entry => entry.widget))];

  const handleDelete = async (id: string) => {
    const success = await deleteEntry(id);
    if (success) {
      toast({
        title: "Success",
        description: "Field deleted successfully",
      });
    }
  };

  const handleClone = (entry: any) => {
    navigate(`/app/build/field/new?clone=${encodeURIComponent(entry.id)}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading fields...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Field Registry</h1>
          <p className="text-muted-foreground">
            Manage reusable field definitions for your application
          </p>
        </div>
        
        <Button asChild>
          <Link to="/app/build/field/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Field
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
                placeholder="Search by field ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterDataType} onValueChange={setFilterDataType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Data Types</SelectItem>
                {uniqueDataTypes.map(type => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterWidget} onValueChange={setFilterWidget}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Widgets</SelectItem>
                {uniqueWidgets.map(widget => (
                  <SelectItem key={widget} value={widget} className="capitalize">
                    {widget}
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
            Field Registry Entries ({filteredEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {entries.length === 0 ? 'No field registry entries found.' : 'No entries match your filters.'}
              </p>
              <Button asChild className="mt-4">
                <Link to="/app/build/field/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Field
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Widget</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Has Options</TableHead>
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
                          {entry.datatype}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {entry.widget}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.ui?.label?.fallback || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.options ? "default" : "secondary"}>
                          {entry.options ? 'Yes' : 'No'}
                        </Badge>
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
                            <Link to={`/app/build/field/${entry.id}`}>
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
                                <AlertDialogTitle>Delete Field</AlertDialogTitle>
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