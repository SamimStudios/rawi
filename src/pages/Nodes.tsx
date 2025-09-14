import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import { DynamicFieldRenderer } from '@/components/field-registry/DynamicFieldRenderer';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface StoryboardNode {
  id: string;
  job_id: string;
  path: any; // ltree type from database
  content: any; // jsonb type from database
  updated_at: string;
}

interface FieldRegistry {
  id: string;
  field_id: string;
  datatype: string;
  widget: string;
  options: any;
  rules: any;
  ui: any;
  default_value: any;
}

export default function Nodes() {
  console.log('Nodes component is running!');
  
  const { t } = useLanguage();
  const [nodes, setNodes] = useState<StoryboardNode[]>([]);
  const [fields, setFields] = useState<FieldRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, Record<string, any>>>({});

  useEffect(() => {
    console.log('useEffect running, calling fetchNodesAndFields');
    fetchNodesAndFields();
  }, []);

  const fetchNodesAndFields = async () => {
    try {
      console.log('fetchNodesAndFields started');
      setLoading(true);
      setError(null);

      // Fetch form nodes
      const { data: nodesData, error: nodesError } = await supabase
        .from('storyboard_nodes')
        .select('id, job_id, path, content, updated_at')
        .eq('node_type', 'form')
        .order('updated_at', { ascending: false });

      console.log('Nodes query result:', { nodesData, nodesError });

      if (nodesError) throw nodesError;

      // Fetch field definitions
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('field_registry')
        .select('*');

      console.log('Fields query result:', { fieldsData, fieldsError });

      if (fieldsError) throw fieldsError;

      setNodes(nodesData || []);
      setFields(fieldsData || []);
      console.log('Data set successfully. Nodes:', nodesData?.length, 'Fields:', fieldsData?.length);
    } catch (e: any) {
      console.error('Error in fetchNodesAndFields:', e);
      setError(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      console.log('Loading finished');
    }
  };

  const updateFieldValue = (nodeId: string, fieldId: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [fieldId]: value
      }
    }));
  };

  const getFieldById = (fieldId: string) => {
    const field = fields.find(f => f.field_id === fieldId);
    console.log('getFieldById called for:', fieldId, 'found:', !!field);
    return field;
  };

  const getGroupLabel = (group: { name: string; label: { fallback: string; key?: string } }) => {
    return group.label?.key ? t(group.label.key) : group.label?.fallback;
  };

  console.log('Render state - loading:', loading, 'error:', error, 'nodes:', nodes.length, 'fields:', fields.length);

  if (loading) {
    console.log('Rendering loading spinner');
    return <LoadingSpinner />;
  }
  
  if (error) {
    console.log('Rendering error:', error);
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

  console.log('Rendering main content');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Storyboard Nodes</h1>
        <p className="text-muted-foreground">
          Form nodes from the storyboard system with field definitions
        </p>
        <p className="text-sm text-muted-foreground">
          Found {nodes.length} nodes and {fields.length} fields
        </p>
      </div>

      {nodes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No form nodes found in the registry.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {nodes.map((node) => {
            console.log('Rendering node:', node.id, 'content:', node.content);
            const nodeFormValues = formValues[node.id] || {};
            
            return (
              <Card key={node.id} className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{node.path}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">Job: {node.job_id.slice(0, 8)}...</Badge>
                        <Badge variant="outline">
                          Updated: {new Date(node.updated_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {node.content.groups?.map((group) => {
                      const groupItems = node.content.items?.filter(
                        item => item.parent?.group_name === group.name
                      ) || [];

                      console.log('Group:', group.name, 'items:', groupItems.length);

                      if (groupItems.length === 0) return null;

                      return (
                        <Collapsible key={group.name} defaultOpen>
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted">
                            <h3 className="text-base font-medium">
                              {getGroupLabel(group)}
                            </h3>
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent className="space-y-4 pt-4">
                            {groupItems.map((item, index) => {
                              console.log('Processing item:', item.ref);
                              const field = getFieldById(item.ref);
                              
                              if (!field) {
                                console.log('Field not found for ref:', item.ref);
                                return (
                                  <div key={index} className="p-3 bg-destructive/10 rounded border border-destructive/20">
                                    <p className="text-destructive text-sm">
                                      Field "{item.ref}" not found in registry
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Available fields: {fields.map(f => f.field_id).join(', ')}
                                    </p>
                                  </div>
                                );
                              }

                              return (
                                <div key={index} className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    {item.required && (
                                      <Badge variant="destructive" className="text-xs">
                                        Required
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <DynamicFieldRenderer
                                    field={field}
                                    value={nodeFormValues[field.field_id]}
                                    onChange={(value) => updateFieldValue(node.id, field.field_id, value)}
                                    formValues={nodeFormValues}
                                  />
                                  
                                  {nodeFormValues[field.field_id] && (
                                    <div className="text-xs text-muted-foreground mt-2">
                                      Current value: {JSON.stringify(nodeFormValues[field.field_id])}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}