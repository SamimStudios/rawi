import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface I18nText {
  fallback: string;
  key?: string;
}

interface CollectionInstance {
  instance_id: number;
  path: string;
  children?: (FieldItem | SectionItem | CollectionSection | CollectionFieldItem)[];
  value?: any;
}

interface CollectionSection {
  kind: 'CollectionSection';
  idx: number;
  path: string;
  label: I18nText;
  description?: I18nText;
  required: boolean;
  hidden: boolean;
  collapsed: boolean;
  min_instances: number;
  max_instances: number;
  instances: CollectionInstance[];
}

interface CollectionFieldItem {
  kind: 'CollectionFieldItem';
  idx: number;
  path: string;
  ref: string;
  editable: boolean;
  required: boolean;
  importance: 'low' | 'normal' | 'high';
  ui: UIBlock;
  min_instances: number;
  max_instances: number;
  instances: CollectionInstance[];
}

interface UIBlock {
  kind: 'UIBlock';
  label: I18nText;
  help?: I18nText;
  placeholder?: I18nText;
  override: boolean;
}

interface FieldItem {
  kind: 'FieldItem';
  idx: number;
  path: string;
  ref: string;
  editable: boolean;
  required: boolean;
  importance: 'low' | 'normal' | 'high';
  ui: UIBlock;
  value: any;
}

interface SectionItem {
  kind: 'SectionItem';
  idx: number;
  path: string;
  label: I18nText;
  description?: I18nText;
  required: boolean;
  hidden: boolean;
  collapsed: boolean;
  children: ContentItem[];
}

type ContentItem = FieldItem | SectionItem | CollectionSection | CollectionFieldItem;

interface FormContent {
  kind: 'FormContent';
  version: 'v2-items';
  items: ContentItem[];
}

interface FormContentEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

export function FormContentEditor({ content, onChange }: FormContentEditorProps) {
  const [formContent, setFormContent] = useState<FormContent>({
    kind: 'FormContent',
    version: 'v2-items',
    items: []
  });
  const [availableFields, setAvailableFields] = useState<Array<{ id: string; ui: any }>>([]);

  useEffect(() => {
    // Initialize from existing content structure - only run once when content changes
    if (!content) return;
    
    if (content.items) {
      setFormContent({
        kind: content.kind || 'FormContent',
        version: content.version || 'v2-items',
        items: content.items || []
      });
    } else if (content.sections) {
      // Legacy sections format - convert to v2-items
      const convertedItems: ContentItem[] = content.sections.map((section: any, idx: number) => ({
        kind: 'SectionItem' as const,
        idx: idx + 1,
        path: section.key || `section_${idx + 1}`,
        label: section.title || { fallback: `Section ${idx + 1}` },
        description: section.ui?.help,
        required: false,
        hidden: false,
        collapsed: false,
        children: (section.fields || []).map((field: any, fieldIdx: number) => ({
          kind: 'FieldItem' as const,
          idx: fieldIdx + 1,
          path: field.field_ref || `field_${fieldIdx + 1}`,
          ref: field.field_ref || '',
          editable: true,
          required: field.required || false,
          importance: field.importance || 'normal',
          ui: {
            kind: 'UIBlock' as const,
            label: field.ui?.label || { fallback: field.field_ref || 'Field' },
            help: field.ui?.help,
            placeholder: field.ui?.placeholder,
            override: false
          },
          value: null
        }))
      }));
      setFormContent({
        kind: 'FormContent',
        version: 'v2-items',
        items: convertedItems
      });
    }
  }, [JSON.stringify(content)]);

  useEffect(() => {
    // Fetch available fields from field registry - only once
    const fetchFields = async () => {
      try {
        const { data, error } = await supabase
          .schema('app' as any)
          .from('field_registry')
          .select('id, ui, datatype, widget')
          .order('id');
        
        if (error) throw error;
        setAvailableFields(data || []);
      } catch (error) {
        console.error('Failed to fetch field registry:', error);
      }
    };

    fetchFields();
  }, []);

  // Use callback to avoid infinite loops
  const handleContentChange = useCallback(() => {
    onChange(formContent);
  }, [formContent, onChange]);

  useEffect(() => {
    // Only update if formContent actually changed
    if (formContent.items.length > 0 || Object.keys(content).length === 0) {
      handleContentChange();
    }
  }, [handleContentChange]);

  const addTopLevelField = () => {
    const newIdx = Math.max(0, ...formContent.items.map(item => item.idx)) + 1;
    const newField: FieldItem = {
      kind: 'FieldItem',
      idx: newIdx,
      path: `field_${newIdx}`,
      ref: '',
      editable: true,
      required: false,
      importance: 'normal',
      ui: {
        kind: 'UIBlock',
        label: { fallback: 'New Field' },
        override: false
      },
      value: null
    };
    
    setFormContent(prev => ({
      ...prev,
      items: [...prev.items, newField]
    }));
  };

  const addSection = () => {
    const newIdx = Math.max(0, ...formContent.items.map(item => item.idx)) + 1;
    const newSection: SectionItem = {
      kind: 'SectionItem',
      idx: newIdx,
      path: `section_${newIdx}`,
      label: { fallback: 'New Section' },
      required: false,
      hidden: false,
      collapsed: false,
      children: []
    };
    
    setFormContent(prev => ({
      ...prev,
      items: [...prev.items, newSection]
    }));
  };

  const updateItem = (index: number, updates: Partial<ContentItem>) => {
    setFormContent(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, ...updates } as ContentItem : item
      )
    }));
  };

  const removeItem = (index: number) => {
    setFormContent(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const addFieldToSection = (sectionIndex: number) => {
    const section = formContent.items[sectionIndex] as SectionItem;
    const newIdx = Math.max(0, ...section.children.map(child => child.idx)) + 1;
    const newField: FieldItem = {
      kind: 'FieldItem',
      idx: newIdx,
      path: `${section.path}.field_${newIdx}`,
      ref: '',
      editable: true,
      required: false,
      importance: 'normal',
      ui: {
        kind: 'UIBlock',
        label: { fallback: 'New Field' },
        override: false
      },
      value: null
    };
    
    const updatedChildren = [...section.children, newField];
    updateItem(sectionIndex, { children: updatedChildren });
  };

  const updateSectionChild = (sectionIndex: number, childIndex: number, updates: Partial<ContentItem>) => {
    const section = formContent.items[sectionIndex] as SectionItem;
    const updatedChildren = section.children.map((child, i) => 
      i === childIndex ? { ...child, ...updates } as ContentItem : child
    );
    updateItem(sectionIndex, { children: updatedChildren });
  };

  const removeSectionChild = (sectionIndex: number, childIndex: number) => {
    const section = formContent.items[sectionIndex] as SectionItem;
    const updatedChildren = section.children.filter((_, i) => i !== childIndex);
    updateItem(sectionIndex, { children: updatedChildren });
  };

  const renderFieldEditor = (field: FieldItem, onUpdate: (updates: Partial<FieldItem>) => void, onRemove: () => void) => (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <GripVertical className="w-4 h-4 text-muted-foreground mt-2 flex-shrink-0" />
        
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Field Reference</Label>
              <Select
                value={field.ref || undefined}
                onValueChange={(value) => onUpdate({ ref: value, path: value })}
              >
                <SelectTrigger id={`field-ref-${field.idx}`}>
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
                value={field.importance}
                onValueChange={(value: 'low' | 'normal' | 'high') => onUpdate({ importance: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Index</Label>
              <Input
                type="number"
                value={field.idx}
                onChange={(e) => onUpdate({ idx: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Label Fallback</Label>
              <Input
                id={`field-label-fallback-${field.idx}`}
                value={field.ui.label?.fallback || ''}
                onChange={(e) => onUpdate({
                  ui: {
                    ...field.ui,
                    label: { ...field.ui.label, fallback: e.target.value }
                  }
                })}
                placeholder="Custom label"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Label Key</Label>
              <Input
                id={`field-label-key-${field.idx}`}
                value={field.ui.label?.key || ''}
                onChange={(e) => onUpdate({
                  ui: {
                    ...field.ui,
                    label: { ...field.ui.label, key: e.target.value }
                  }
                })}
                placeholder="translation.key"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Help Fallback</Label>
              <Input
                id={`field-help-fallback-${field.idx}`}
                value={field.ui.help?.fallback || ''}
                onChange={(e) => onUpdate({
                  ui: {
                    ...field.ui,
                    help: { ...field.ui.help, fallback: e.target.value }
                  }
                })}
                placeholder="Help text"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Help Key</Label>
              <Input
                id={`field-help-key-${field.idx}`}
                value={field.ui.help?.key || ''}
                onChange={(e) => onUpdate({
                  ui: {
                    ...field.ui,
                    help: { ...field.ui.help, key: e.target.value }
                  }
                })}
                placeholder="help.key"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Placeholder Fallback</Label>
              <Input
                id={`field-placeholder-fallback-${field.idx}`}
                value={field.ui.placeholder?.fallback || ''}
                onChange={(e) => onUpdate({
                  ui: {
                    ...field.ui,
                    placeholder: { ...field.ui.placeholder, fallback: e.target.value }
                  }
                })}
                placeholder="Placeholder text"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Placeholder Key</Label>
              <Input
                id={`field-placeholder-key-${field.idx}`}
                value={field.ui.placeholder?.key || ''}
                onChange={(e) => onUpdate({
                  ui: {
                    ...field.ui,
                    placeholder: { ...field.ui.placeholder, key: e.target.value }
                  }
                })}
                placeholder="placeholder.key"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={field.required}
                onCheckedChange={(checked) => onUpdate({ required: checked })}
              />
              <Label className="text-xs">Required</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={field.editable}
                onCheckedChange={(checked) => onUpdate({ editable: checked })}
              />
              <Label className="text-xs">Editable</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={field.ui.override}
                onCheckedChange={(checked) => onUpdate({
                  ui: { ...field.ui, override: checked }
                })}
              />
              <Label className="text-xs">Override</Label>
            </div>
            
            <Badge variant={field.importance === 'high' ? 'destructive' : field.importance === 'normal' ? 'default' : 'secondary'}>
              {field.importance}
            </Badge>
          </div>
        </div>

        <Button onClick={onRemove} variant="ghost" size="sm">
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );

  const renderSectionEditor = (section: SectionItem, sectionIndex: number) => (
    <Card key={sectionIndex} className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateItem(sectionIndex, { collapsed: !section.collapsed })}
            >
              {section.collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <CardTitle className="text-base">Section: {section.label.fallback}</CardTitle>
          </div>
          <Button onClick={() => removeItem(sectionIndex)} variant="ghost" size="sm">
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      
      {!section.collapsed && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Section Path</Label>
              <Input
                value={section.path}
                onChange={(e) => updateItem(sectionIndex, { path: e.target.value })}
                placeholder="section_path"
              />
            </div>
            <div className="space-y-2">
              <Label>Label (Fallback Text)</Label>
              <Input
                value={section.label.fallback}
                onChange={(e) => updateItem(sectionIndex, {
                  label: { ...section.label, fallback: e.target.value }
                })}
                placeholder="Section Label"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={section.description?.fallback || ''}
              onChange={(e) => updateItem(sectionIndex, {
                description: { fallback: e.target.value }
              })}
              placeholder="Section description"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={section.required}
                onCheckedChange={(checked) => updateItem(sectionIndex, { required: checked })}
              />
              <Label className="text-xs">Required</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={section.hidden}
                onCheckedChange={(checked) => updateItem(sectionIndex, { hidden: checked })}
              />
              <Label className="text-xs">Hidden</Label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Fields in Section</h4>
              <Button
                onClick={() => addFieldToSection(sectionIndex)}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>

            {section.children.length === 0 ? (
              <div className="text-center py-4 border border-dashed rounded-md">
                <p className="text-muted-foreground mb-2">No fields in this section</p>
                <Button
                  onClick={() => addFieldToSection(sectionIndex)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {section.children.map((child, childIndex) => {
                  if (child.kind === 'FieldItem') {
                    return renderFieldEditor(
                      child,
                      (updates) => updateSectionChild(sectionIndex, childIndex, updates),
                      () => removeSectionChild(sectionIndex, childIndex)
                    );
                  }
                  return null; // Nested sections not supported in this UI
                })}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Form Content (v2-items)</h3>
          <p className="text-sm text-muted-foreground">
            Configure fields and sections for this form node
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addTopLevelField} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
          <Button onClick={addSection} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </div>
      </div>

      {formContent.items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No content configured</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={addTopLevelField} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
                <Button onClick={addSection} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {formContent.items.map((item, index) => {
            if (item.kind === 'FieldItem') {
              return renderFieldEditor(
                item,
                (updates) => updateItem(index, updates),
                () => removeItem(index)
              );
            } else if (item.kind === 'SectionItem') {
              return renderSectionEditor(item, index);
            }
            return null;
          })}
        </div>
      )}
      
      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
        <strong>Debug Info:</strong> Content structure: {formContent.version}, Items: {formContent.items.length}, Available fields: {availableFields.length}
      </div>
    </div>
  );
}