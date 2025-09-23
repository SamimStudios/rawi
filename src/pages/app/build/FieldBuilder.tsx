import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type DataType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'uuid' | 'url' | 'date' | 'datetime';
type Widget = 'text' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'tags' | 'date' | 'datetime' | 'url' | 'number' | 'switch' | 'file';

interface FieldOption {
  value: string;
  label: {
    fallback: string;
    key?: string;
  };
}

interface FieldData {
  id: string;
  datatype: DataType;
  widget: Widget;
  options: {
    source?: 'static' | 'table' | 'endpoint';
    values?: FieldOption[];
    table?: string;
    valueColumn?: string;
    labelColumn?: string;
    extraColumns?: string[];
    where?: Array<{ column: string; op: string; value: any }>;
    orderBy?: Array<{ column: string; dir: 'asc' | 'desc' }>;
    limit?: number;
  } | null;
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    minItems?: number;
    maxItems?: number;
  };
  ui: {
    label: {
      fallback: string;
      key?: string;
    };
    help?: {
      fallback: string;
      key?: string;
    };
    placeholder?: {
      fallback: string;
      key?: string;
    };
  };
  default_value?: any;
}

const dataTypeOptions: DataType[] = ['string', 'number', 'boolean', 'array', 'object', 'uuid', 'url', 'date', 'datetime'];
const widgetOptions: Widget[] = ['text', 'textarea', 'select', 'multiselect', 'radio', 'checkbox', 'tags', 'date', 'datetime', 'url', 'number', 'switch', 'file'];

const getCompatibleWidgets = (dataType: DataType): Widget[] => {
  switch (dataType) {
    case 'string':
      return ['text', 'textarea', 'select', 'radio', 'url'];
    case 'number':
      return ['number', 'select', 'radio'];
    case 'boolean':
      return ['checkbox', 'switch', 'select', 'radio'];
    case 'array':
      return ['tags', 'multiselect', 'checkbox'];
    case 'uuid':
      return ['select', 'radio'];
    case 'date':
      return ['date'];
    case 'datetime':
      return ['datetime'];
    case 'url':
      return ['url', 'text'];
    case 'object':
      return ['file'];
    default:
      return ['text'];
  }
};

const widgetRequiresOptions = (widget: Widget): boolean => {
  return ['select', 'multiselect', 'radio', 'checkbox', 'tags'].includes(widget);
};

export default function FieldBuilder() {
  const { toast } = useToast();
  const [field, setField] = useState<FieldData>({
    id: '',
    datatype: 'string',
    widget: 'text',
    options: null,
    rules: {},
    ui: {
      label: { fallback: '' }
    }
  });

  const [options, setOptions] = useState<FieldOption[]>([]);
  const [optionSource, setOptionSource] = useState<'static' | 'table' | 'endpoint'>('static');

  const compatibleWidgets = getCompatibleWidgets(field.datatype);

  const handleDataTypeChange = (datatype: DataType) => {
    const compatible = getCompatibleWidgets(datatype);
    const newWidget = compatible.includes(field.widget) ? field.widget : compatible[0];
    
    setField(prev => ({
      ...prev,
      datatype,
      widget: newWidget,
      options: widgetRequiresOptions(newWidget) ? (prev.options || { source: 'static', values: [] }) : null
    }));
  };

  const handleWidgetChange = (widget: Widget) => {
    setField(prev => ({
      ...prev,
      widget,
      options: widgetRequiresOptions(widget) ? (prev.options || { source: 'static', values: [] }) : null
    }));
  };

  const addOption = () => {
    const newOption: FieldOption = {
      value: '',
      label: { fallback: '' }
    };
    setOptions([...options, newOption]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, updates: Partial<FieldOption>) => {
    setOptions(options.map((option, i) => 
      i === index ? { ...option, ...updates } : option
    ));
  };

  const handleSave = async () => {
    if (!field.id || !field.ui.label.fallback) {
      toast({
        title: "Validation Error",
        description: "Field ID and Label are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const fieldData = {
        ...field,
        options: field.options ? {
          ...field.options,
          ...(optionSource === 'static' && { values: options })
        } : null
      };

      const { error } = await supabase
        .from('field_registry')
        .insert({
          id: fieldData.id,
          datatype: fieldData.datatype as any,
          widget: fieldData.widget as any,
          options: JSON.parse(JSON.stringify(fieldData.options)),
          rules: JSON.parse(JSON.stringify(fieldData.rules)),
          ui: JSON.parse(JSON.stringify(fieldData.ui)),
          default_value: fieldData.default_value ? JSON.parse(JSON.stringify(fieldData.default_value)) : null
        } as any)
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Field created successfully"
      });

      // Reset form
      setField({
        id: '',
        datatype: 'string',
        widget: 'text',
        options: null,
        rules: {},
        ui: { label: { fallback: '' } }
      });
      setOptions([]);
    } catch (error) {
      console.error('Error saving field:', error);
      toast({
        title: "Error",
        description: "Failed to save field",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Field Builder</h1>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Field
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="id">Field ID*</Label>
              <Input
                id="id"
                value={field.id}
                onChange={(e) => setField(prev => ({ ...prev, id: e.target.value }))}
                placeholder="unique_field_id"
              />
            </div>

            <div>
              <Label>Data Type</Label>
              <Select value={field.datatype} onValueChange={handleDataTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dataTypeOptions.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Widget</Label>
              <Select value={field.widget} onValueChange={handleWidgetChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {compatibleWidgets.map(widget => (
                    <SelectItem key={widget} value={widget}>{widget}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* UI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>UI Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="label">Label*</Label>
              <Input
                id="label"
                value={field.ui.label.fallback}
                onChange={(e) => setField(prev => ({
                  ...prev,
                  ui: { ...prev.ui, label: { ...prev.ui.label, fallback: e.target.value } }
                }))}
                placeholder="Field Label"
              />
            </div>

            <div>
              <Label htmlFor="placeholder">Placeholder</Label>
              <Input
                id="placeholder"
                value={field.ui.placeholder?.fallback || ''}
                onChange={(e) => setField(prev => ({
                  ...prev,
                  ui: { 
                    ...prev.ui, 
                    placeholder: e.target.value ? { fallback: e.target.value } : undefined
                  }
                }))}
                placeholder="Placeholder text"
              />
            </div>

            <div>
              <Label htmlFor="help">Help Text</Label>
              <Textarea
                id="help"
                value={field.ui.help?.fallback || ''}
                onChange={(e) => setField(prev => ({
                  ...prev,
                  ui: { 
                    ...prev.ui, 
                    help: e.target.value ? { fallback: e.target.value } : undefined
                  }
                }))}
                placeholder="Help text for users"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Validation Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Validation Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Required</Label>
              <Switch
                checked={field.rules.required || false}
                onCheckedChange={(checked) => setField(prev => ({
                  ...prev,
                  rules: { ...prev.rules, required: checked }
                }))}
              />
            </div>

            {field.datatype === 'string' && (
              <>
                <div>
                  <Label htmlFor="minLength">Min Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    value={field.rules.minLength || ''}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      rules: { ...prev.rules, minLength: e.target.value ? parseInt(e.target.value) : undefined }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxLength">Max Length</Label>
                  <Input
                    id="maxLength"
                    type="number"
                    value={field.rules.maxLength || ''}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      rules: { ...prev.rules, maxLength: e.target.value ? parseInt(e.target.value) : undefined }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="pattern">Pattern (Regex)</Label>
                  <Input
                    id="pattern"
                    value={field.rules.pattern || ''}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      rules: { ...prev.rules, pattern: e.target.value || undefined }
                    }))}
                    placeholder="^[a-zA-Z0-9]+$"
                  />
                </div>
              </>
            )}

            {field.datatype === 'number' && (
              <>
                <div>
                  <Label htmlFor="min">Min Value</Label>
                  <Input
                    id="min"
                    type="number"
                    value={field.rules.min || ''}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      rules: { ...prev.rules, min: e.target.value ? parseFloat(e.target.value) : undefined }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="max">Max Value</Label>
                  <Input
                    id="max"
                    type="number"
                    value={field.rules.max || ''}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      rules: { ...prev.rules, max: e.target.value ? parseFloat(e.target.value) : undefined }
                    }))}
                  />
                </div>
              </>
            )}

            {field.datatype === 'array' && (
              <>
                <div>
                  <Label htmlFor="minItems">Min Items</Label>
                  <Input
                    id="minItems"
                    type="number"
                    value={field.rules.minItems || ''}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      rules: { ...prev.rules, minItems: e.target.value ? parseInt(e.target.value) : undefined }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxItems">Max Items</Label>
                  <Input
                    id="maxItems"
                    type="number"
                    value={field.rules.maxItems || ''}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      rules: { ...prev.rules, maxItems: e.target.value ? parseInt(e.target.value) : undefined }
                    }))}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Options Configuration */}
        {widgetRequiresOptions(field.widget) && (
          <Card>
            <CardHeader>
              <CardTitle>Options Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Options Source</Label>
                <Select value={optionSource} onValueChange={(value: 'static' | 'table' | 'endpoint') => setOptionSource(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static Options</SelectItem>
                    <SelectItem value="table">Database Table</SelectItem>
                    <SelectItem value="endpoint">API Endpoint</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {optionSource === 'static' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Options</Label>
                    <Button onClick={addOption} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded">
                      <div className="flex-1">
                        <Input
                          placeholder="Value"
                          value={option.value}
                          onChange={(e) => updateOption(index, { value: e.target.value })}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="Label"
                          value={option.label.fallback}
                          onChange={(e) => updateOption(index, { 
                            label: { ...option.label, fallback: e.target.value }
                          })}
                        />
                      </div>
                      <Button
                        onClick={() => removeOption(index)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {optionSource === 'table' && (
                <div className="space-y-3">
                  <Input
                    placeholder="Table name (e.g., public.templates)"
                    value={field.options?.table || ''}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      options: { ...prev.options, table: e.target.value }
                    }))}
                  />
                  <Input
                    placeholder="Value column"
                    value={field.options?.valueColumn || ''}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      options: { ...prev.options, valueColumn: e.target.value }
                    }))}
                  />
                  <Input
                    placeholder="Label column"
                    value={field.options?.labelColumn || ''}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      options: { ...prev.options, labelColumn: e.target.value }
                    }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg">
            <Label className="text-sm font-medium">{field.ui.label.fallback || 'Field Label'}</Label>
            {field.ui.help && (
              <p className="text-sm text-muted-foreground mt-1">{field.ui.help.fallback}</p>
            )}
            <div className="mt-2">
              <Badge variant="outline">{field.datatype}</Badge>
              <Badge variant="outline" className="ml-2">{field.widget}</Badge>
              {field.rules.required && (
                <Badge variant="destructive" className="ml-2">Required</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}