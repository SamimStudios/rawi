import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FormSection {
  key: string;
  title: {
    fallback: string;
    key?: string;
  };
  fields: FormField[];
  ui?: {
    help?: {
      fallback: string;
      key?: string;
    };
  };
}

interface FormField {
  field_ref: string;
  required: boolean;
  importance?: 'low' | 'medium' | 'high';
  ui?: {
    label?: {
      fallback: string;
      key?: string;
    };
    help?: {
      fallback: string;
      key?: string;
    };
  };
}

interface FormContentEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

export function FormContentEditor({ content, onChange }: FormContentEditorProps) {
  const [sections, setSections] = useState<FormSection[]>([]);
  const [availableFields, setAvailableFields] = useState<Array<{ id: string; ui: any }>>([]);

  useEffect(() => {
    // Initialize sections from content
    const contentSections = content.sections || [];
    setSections(Array.isArray(contentSections) ? contentSections : []);
  }, [content]);

  useEffect(() => {
    // Fetch available fields from field registry
    const fetchFields = async () => {
      try {
        const { data, error } = await supabase
          .schema('app' as any)
          .from('field_registry')
          .select('id, ui')
          .order('id');
        
        if (error) throw error;
        setAvailableFields(data || []);
      } catch (error) {
        console.error('Error fetching fields:', error);
      }
    };

    fetchFields();
  }, []);

  useEffect(() => {
    // Update parent content when sections change
    onChange({
      ...content,
      sections: sections
    });
  }, [sections, onChange, content]);

  const addSection = () => {
    const newSection: FormSection = {
      key: `section_${Date.now()}`,
      title: {
        fallback: 'New Section',
        key: ''
      },
      fields: []
    };
    setSections(prev => [...prev, newSection]);
  };

  const updateSection = (index: number, updates: Partial<FormSection>) => {
    setSections(prev => prev.map((section, i) => 
      i === index ? { ...section, ...updates } : section
    ));
  };

  const removeSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const addField = (sectionIndex: number) => {
    const newField: FormField = {
      field_ref: '',
      required: false,
      importance: 'medium'
    };
    
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? { ...section, fields: [...section.fields, newField] }
        : section
    ));
  };

  const updateField = (sectionIndex: number, fieldIndex: number, updates: Partial<FormField>) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? {
            ...section,
            fields: section.fields.map((field, j) => 
              j === fieldIndex ? { ...field, ...updates } : field
            )
          }
        : section
    ));
  };

  const removeField = (sectionIndex: number, fieldIndex: number) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? { ...section, fields: section.fields.filter((_, j) => j !== fieldIndex) }
        : section
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Form Sections</h3>
          <p className="text-sm text-muted-foreground">
            Configure the sections and fields for this form node
          </p>
        </div>
        <Button onClick={addSection} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
      </div>

      {sections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No sections configured</p>
              <Button onClick={addSection} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add First Section
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section, sectionIndex) => (
            <Card key={section.key} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Section {sectionIndex + 1}</CardTitle>
                  <Button
                    onClick={() => removeSection(sectionIndex)}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Section Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Section Key</Label>
                    <Input
                      value={section.key}
                      onChange={(e) => updateSection(sectionIndex, { key: e.target.value })}
                      placeholder="section_key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Title (Fallback Text)</Label>
                    <Input
                      value={section.title.fallback}
                      onChange={(e) => updateSection(sectionIndex, {
                        title: { ...section.title, fallback: e.target.value }
                      })}
                      placeholder="Section Title"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title Translation Key (Optional)</Label>
                  <Input
                    value={section.title.key || ''}
                    onChange={(e) => updateSection(sectionIndex, {
                      title: { ...section.title, key: e.target.value }
                    })}
                    placeholder="translations.section.title"
                  />
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Fields</h4>
                    <Button
                      onClick={() => addField(sectionIndex)}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Field
                    </Button>
                  </div>

                  {section.fields.length === 0 ? (
                    <div className="text-center py-4 border border-dashed rounded-md">
                      <p className="text-muted-foreground mb-2">No fields in this section</p>
                      <Button
                        onClick={() => addField(sectionIndex)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {section.fields.map((field, fieldIndex) => (
                        <Card key={fieldIndex} className="p-4">
                          <div className="flex items-start gap-4">
                            <GripVertical className="w-4 h-4 text-muted-foreground mt-2 flex-shrink-0" />
                            
                            <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Field Reference</Label>
                                  <Select
                                    value={field.field_ref}
                                    onValueChange={(value) => updateField(sectionIndex, fieldIndex, { field_ref: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select field" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableFields.map(availableField => (
                                        <SelectItem key={availableField.id} value={availableField.id}>
                                          {availableField.id}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">Importance</Label>
                                  <Select
                                    value={field.importance || 'medium'}
                                    onValueChange={(value: 'low' | 'medium' | 'high') => 
                                      updateField(sectionIndex, fieldIndex, { importance: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.required}
                                  onCheckedChange={(checked) => 
                                    updateField(sectionIndex, fieldIndex, { required: checked })
                                  }
                                />
                                <Label className="text-xs">Required</Label>
                                <Badge variant={field.importance === 'high' ? 'destructive' : field.importance === 'medium' ? 'default' : 'secondary'}>
                                  {field.importance || 'medium'}
                                </Badge>
                              </div>
                            </div>

                            <Button
                              onClick={() => removeField(sectionIndex, fieldIndex)}
                              variant="ghost"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}