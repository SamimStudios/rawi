import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Save, ArrowLeft, Eye, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useNodeLibrary, type NodeLibraryEntry } from '@/hooks/useNodeLibrary';
import { FormContentEditor } from './components/FormContentEditor';
import { MediaContentEditor } from './components/MediaContentEditor';
import { GroupContentEditor } from './components/GroupContentEditor';

import { PayloadEditor } from './components/PayloadEditor';
import isEqual from 'lodash/isEqual';

export default function NodeLibraryBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { entries, n8nFunctions, loading, saveEntry, validateEntry, fetchEntries, fetchN8NFunctions } = useNodeLibrary();

  const [entry, setEntry] = useState<NodeLibraryEntry>({
    id: '',
    node_type: 'form',
    content: {},
    payload_validate: null,
    payload_generate: null,
    validate_n8n_id: null,
    generate_n8n_id: null,
    active: true,
    version: 1,
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchEntries();
    fetchN8NFunctions();
  }, [fetchEntries, fetchN8NFunctions]);

  useEffect(() => {
    if (id && entries.length > 0) {
      const existingEntry = entries.find(e => e.id === id);
      if (existingEntry) {
        setEntry(existingEntry);
      } else {
        toast({
          title: "Entry not found",
          description: "The requested node library entry was not found.",
          variant: "destructive",
        });
        navigate('/app/build/node');
      }
    }
  }, [id, entries, navigate, toast]);

  const handleSave = async () => {
    if (!entry.id.trim()) {
      toast({
        title: "Validation Error",
        description: "Node ID is required",
        variant: "destructive",
      });
      return;
    }

    // Validate ID pattern (alphanumeric, underscores, hyphens)
    if (!/^[a-zA-Z0-9_-]+$/.test(entry.id)) {
      toast({
        title: "Validation Error",
        description: "Node ID can only contain letters, numbers, underscores, and hyphens",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setValidationErrors([]);

    try {
      // Validate content structure
      const isValidContent = await validateEntry(entry);
      if (!isValidContent) {
        setValidationErrors(['Invalid content structure for node type']);
        return;
      }

      const success = await saveEntry(entry);
      if (success) {
        navigate('/app/build/node');
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = useCallback((newContent: Record<string, any>) => {
    setEntry(prev => (isEqual(prev.content, newContent) ? prev : { ...prev, content: newContent }));
  }, []);

  const renderContentEditor = () => {
    switch (entry.node_type) {
      case 'form':
        return (
          <FormContentEditor 
            content={entry.content} 
            onChange={handleContentChange}
          />
        );
      case 'media':
        return (
          <MediaContentEditor 
            content={entry.content} 
            onChange={handleContentChange}
          />
        );
      case 'group':
        return (
          <GroupContentEditor 
            content={entry.content} 
            onChange={handleContentChange}
          />
        );
      default:
        return <div>Unknown node type</div>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app/build/node">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Node Library
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {id ? 'Edit' : 'Create'} Node Library Entry
          </h1>
          <p className="text-muted-foreground">
            Configure a reusable node for your application
          </p>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Validation Errors</h3>
                <ul className="mt-2 list-disc list-inside text-sm">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id">Node ID *</Label>
              <Input
                id="id"
                value={entry.id}
                onChange={(e) => setEntry(prev => ({ ...prev, id: e.target.value }))}
                placeholder="my-node-id"
                disabled={!!id} // Disable editing ID for existing entries
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nodeType">Node Type *</Label>
              <Select 
                value={entry.node_type} 
                onValueChange={(value: 'form' | 'media' | 'group') => 
                  setEntry(prev => ({ ...prev, node_type: value, content: {} }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                type="number"
                min="1"
                value={entry.version}
                onChange={(e) => setEntry(prev => ({ ...prev, version: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div className="flex items-center space-x-2 pt-7">
              <Switch
                id="active"
                checked={entry.active}
                onCheckedChange={(checked) => setEntry(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Content Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure the content structure for this {entry.node_type} node
          </p>
        </CardHeader>
        <CardContent>
          {renderContentEditor()}
        </CardContent>
      </Card>

      {/* N8N Integration */}
      <Card>
        <CardHeader>
          <CardTitle>N8N Integration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect this node to N8N functions for validation and generation
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validateN8NId">Validation Function</Label>
              <Select 
                value={entry.validate_n8n_id ?? 'none'} 
                onValueChange={(value) => setEntry(prev => ({ ...prev, validate_n8n_id: value === 'none' ? null : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select validation function" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {n8nFunctions.map(func => (
                    <SelectItem key={func.id} value={func.id}>
                      {func.name} ({func.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="generateN8NId">Generation Function</Label>
              <Select 
                value={entry.generate_n8n_id ?? 'none'} 
                onValueChange={(value) => setEntry(prev => ({ ...prev, generate_n8n_id: value === 'none' ? null : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select generation function" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {n8nFunctions.map(func => (
                    <SelectItem key={func.id} value={func.id}>
                      {func.name} ({func.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payload Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Payload Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure the payloads sent to N8N functions
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <PayloadEditor
            label="Validation Payload"
            value={entry.payload_validate}
            onChange={(payload) => setEntry(prev => ({ ...prev, payload_validate: payload }))}
            placeholder="JSON payload for validation function"
          />
          
          <Separator />
          
          <PayloadEditor
            label="Generation Payload"
            value={entry.payload_generate}
            onChange={(payload) => setEntry(prev => ({ ...prev, payload_generate: payload }))}
            placeholder="JSON payload for generation function"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Node'}
        </Button>
        
        <Button variant="outline" asChild>
          <Link to="/app/build/node">
            Cancel
          </Link>
        </Button>
      </div>
    </div>
  );
}