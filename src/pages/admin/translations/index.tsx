import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = ['general', 'navigation', 'auth', 'wallet', 'jobs', 'dashboard', 'settings', 'legal'];

export default function TranslationsAdmin() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newEnValue, setNewEnValue] = useState('');
  const [newArValue, setNewArValue] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch translations
  const { data: translations, isLoading } = useQuery({
    queryKey: ['admin-translations', selectedCategory, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('translations')
        .select(`
          *,
          translation_values(*)
        `)
        .order('key');

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike('key', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    }
  });

  // Add translation mutation
  const addTranslationMutation = useMutation({
    mutationFn: async () => {
      // Insert translation
      const { data: translation, error: translationError } = await supabase
        .from('translations')
        .insert({
          key: newKey,
          category: newCategory,
        })
        .select()
        .single();

      if (translationError) throw translationError;

      // Insert English value
      const { error: enError } = await supabase
        .from('translation_values')
        .insert({
          translation_id: translation.id,
          language: 'en',
          value: newEnValue,
        });

      if (enError) throw enError;

      // Insert Arabic value
      const { error: arError } = await supabase
        .from('translation_values')
        .insert({
          translation_id: translation.id,
          language: 'ar',
          value: newArValue,
        });

      if (arError) throw arError;
    },
    onSuccess: () => {
      toast({
        title: 'Translation added',
        description: 'The translation has been successfully added.',
      });
      setIsAddDialogOpen(false);
      setNewKey('');
      setNewEnValue('');
      setNewArValue('');
      setNewCategory('general');
      queryClient.invalidateQueries({ queryKey: ['admin-translations'] });
      queryClient.invalidateQueries({ queryKey: ['translations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddTranslation = () => {
    if (!newKey || !newEnValue || !newArValue) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }
    addTranslationMutation.mutate();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Translation Management</h1>
          <p className="text-muted-foreground">Manage translations for the application</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Translation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Translation</DialogTitle>
              <DialogDescription>
                Add a new translation key with English and Arabic values
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="key">Translation Key</Label>
                <Input
                  id="key"
                  placeholder="e.g. welcomeMessage"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="en-value">English Value</Label>
                <Input
                  id="en-value"
                  placeholder="English translation"
                  value={newEnValue}
                  onChange={(e) => setNewEnValue(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="ar-value">Arabic Value</Label>
                <Input
                  id="ar-value"
                  placeholder="الترجمة العربية"
                  dir="rtl"
                  value={newArValue}
                  onChange={(e) => setNewArValue(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTranslation} disabled={addTranslationMutation.isPending}>
                {addTranslationMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Translation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search translations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by key..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : translations && translations.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>English</TableHead>
                  <TableHead className="text-right">Arabic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {translations.map((trans) => {
                  const enValue = trans.translation_values?.find((tv: any) => tv.language === 'en');
                  const arValue = trans.translation_values?.find((tv: any) => tv.language === 'ar');
                  
                  return (
                    <TableRow key={trans.id}>
                      <TableCell className="font-mono text-sm">{trans.key}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{trans.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{enValue?.value || '-'}</TableCell>
                      <TableCell className="text-right max-w-xs truncate" dir="rtl">
                        {arValue?.value || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No translations found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Click "Add Translation" to create your first translation
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
