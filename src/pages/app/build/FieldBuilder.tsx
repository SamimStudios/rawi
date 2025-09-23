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
import { useFieldContracts, type RuleConfig } from '@/hooks/useFieldContracts';

type DataType = string;
type Widget = string;

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
  rules: Record<string, any>;
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

const dataTypeOptions: DataType[] = [];
const widgetOptions: Widget[] = [];

const getCompatibleWidgets = (dataType: DataType, contracts: any): Widget[] => {
  if (!contracts) return [];
  return contracts.widgetCompatibility[dataType] || [];
};

const widgetRequiresOptions = (widget: Widget): boolean => {
  return ['select', 'radio', 'checkbox', 'tags'].includes(widget);
};

export default function FieldBuilder() {
  const { toast } = useToast();
  const { contracts, loading: contractsLoading, getAvailableWidgets, getAvailableRules, widgetRequiresOptions: contractWidgetRequiresOptions } = useFieldContracts();
  const [field, setField] = useState<FieldData>({
    id: '',
    datatype: 'string' as DataType,
    widget: 'text' as Widget,
    options: null,
    rules: {},
    ui: {
      label: { fallback: '' }
    }
  });

  const [options, setOptions] = useState<FieldOption[]>([]);
  const [optionSource, setOptionSource] = useState<'static' | 'table' | 'endpoint'>('static');

  const availableDataTypes = contracts?.datatypes || [];
  const availableWidgets = getAvailableWidgets(field.datatype);
  const availableRules = getAvailableRules(field.datatype);

  if (contractsLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading field contracts...</div>
      </div>
    );
  }

  const handleDataTypeChange = (datatype: DataType) => {
    const compatible = getAvailableWidgets(datatype);
    const newWidget = compatible.includes(field.widget) ? field.widget : compatible[0];
    
    setField(prev => ({
      ...prev,
      datatype,
      widget: newWidget,
      rules: {}, // Reset rules when datatype changes
      options: contractWidgetRequiresOptions(newWidget) ? (prev.options || { source: 'static', values: [] }) : null
    }));
  };

  const handleWidgetChange = (widget: Widget) => {
    setField(prev => ({
      ...prev,
      widget,
      options: contractWidgetRequiresOptions(widget) ? (prev.options || { source: 'static', values: [] }) : null
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

      const insertData = {
        id: fieldData.id,
        datatype: fieldData.datatype as any,
        widget: fieldData.widget as any,
        options: fieldData.options || {},
        rules: fieldData.rules || {},
        ui: fieldData.ui || {},
        default_value: fieldData.default_value || null
      };

      const { error } = await supabase
        .from('field_registry')
        .insert(insertData as any);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Field created successfully"
      });

      // Reset form
      setField({
        id: '',
        datatype: 'string' as DataType,
        widget: 'text' as Widget,
        options: null,
        rules: {},
        ui: { label: { fallback: '' } }
      });
      setOptions([]);
    } catch (error) {
      console.error('Error saving field:', error);
      toast({
        title: "Error",
        description: `Failed to save field: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
                  {availableDataTypes.map(type => (
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
                  {availableWidgets.map(widget => (
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
          <CardContent className="space-y-6">
            {/* Label Fields */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Label*</Label>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <Label htmlFor="label-key" className="text-xs text-muted-foreground">Translation Key</Label>
                  <Input
                    id="label-key"
                    value={field.ui.label.key || ''}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      ui: { ...prev.ui, label: { ...prev.ui.label, key: e.target.value || undefined } }
                    }))}
                    placeholder="label.field_name"
                  />
                </div>
                <div>
                  <Label htmlFor="label-fallback" className="text-xs text-muted-foreground">Default Text</Label>
                  <Input
                    id="label-fallback"
                    value={field.ui.label.fallback}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      ui: { ...prev.ui, label: { ...prev.ui.label, fallback: e.target.value } }
                    }))}
                    placeholder="Field Label"
                  />
                </div>
              </div>
            </div>

            {/* Placeholder Fields */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Placeholder</Label>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <Label htmlFor="placeholder-key" className="text-xs text-muted-foreground">Translation Key</Label>
                  <Input
                    id="placeholder-key"
                    value={field.ui.placeholder?.key || ''}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      ui: { 
                        ...prev.ui, 
                        placeholder: {
                          ...prev.ui.placeholder,
                          key: e.target.value || undefined,
                          fallback: prev.ui.placeholder?.fallback || ''
                        }
                      }
                    }))}
                    placeholder="placeholder.field_name"
                  />
                </div>
                <div>
                  <Label htmlFor="placeholder-fallback" className="text-xs text-muted-foreground">Default Text</Label>
                  <Input
                    id="placeholder-fallback"
                    value={field.ui.placeholder?.fallback || ''}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      ui: { 
                        ...prev.ui, 
                        placeholder: e.target.value ? { 
                          ...prev.ui.placeholder,
                          fallback: e.target.value 
                        } : undefined
                      }
                    }))}
                    placeholder="Enter placeholder text"
                  />
                </div>
              </div>
            </div>

            {/* Help Text Fields */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Help Text</Label>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <Label htmlFor="help-key" className="text-xs text-muted-foreground">Translation Key</Label>
                  <Input
                    id="help-key"
                    value={field.ui.help?.key || ''}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      ui: { 
                        ...prev.ui, 
                        help: {
                          ...prev.ui.help,
                          key: e.target.value || undefined,
                          fallback: prev.ui.help?.fallback || ''
                        }
                      }
                    }))}
                    placeholder="help.field_name"
                  />
                </div>
                <div>
                  <Label htmlFor="help-fallback" className="text-xs text-muted-foreground">Default Text</Label>
                  <Textarea
                    id="help-fallback"
                    value={field.ui.help?.fallback || ''}
                    onChange={(e) => setField(prev => ({
                      ...prev,
                      ui: { 
                        ...prev.ui, 
                        help: e.target.value ? { 
                          ...prev.ui.help,
                          fallback: e.target.value 
                        } : undefined
                      }
                    }))}
                    placeholder="Help text for users"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Validation Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(availableRules).map(([ruleKey, ruleConfig]) => (
              <div key={ruleKey}>
                {ruleConfig.type === 'boolean' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{ruleConfig.label}</Label>
                      {ruleConfig.description && (
                        <p className="text-sm text-muted-foreground">{ruleConfig.description}</p>
                      )}
                    </div>
                    <Switch
                      checked={field.rules[ruleKey] || false}
                      onCheckedChange={(checked) => setField(prev => ({
                        ...prev,
                        rules: { ...prev.rules, [ruleKey]: checked }
                      }))}
                    />
                  </div>
                )}
                
                {ruleConfig.type === 'number' && (
                  <div>
                    <Label htmlFor={ruleKey}>{ruleConfig.label}</Label>
                    {ruleConfig.description && (
                      <p className="text-sm text-muted-foreground mb-2">{ruleConfig.description}</p>
                    )}
                    <Input
                      id={ruleKey}
                      type="number"
                      min={ruleConfig.min}
                      max={ruleConfig.max}
                      value={field.rules[ruleKey] || ''}
                      onChange={(e) => setField(prev => ({
                        ...prev,
                        rules: { 
                          ...prev.rules, 
                          [ruleKey]: e.target.value ? parseFloat(e.target.value) : undefined 
                        }
                      }))}
                    />
                  </div>
                )}
                
                {ruleConfig.type === 'string' && (
                  <div>
                    <Label htmlFor={ruleKey}>{ruleConfig.label}</Label>
                    {ruleConfig.description && (
                      <p className="text-sm text-muted-foreground mb-2">{ruleConfig.description}</p>
                    )}
                    <Input
                      id={ruleKey}
                      value={field.rules[ruleKey] || ''}
                      onChange={(e) => setField(prev => ({
                        ...prev,
                        rules: { ...prev.rules, [ruleKey]: e.target.value || undefined }
                      }))}
                    />
                  </div>
                )}
                
                {ruleConfig.type === 'array' && ruleConfig.options && (
                  <div>
                    <Label>{ruleConfig.label}</Label>
                    {ruleConfig.description && (
                      <p className="text-sm text-muted-foreground mb-2">{ruleConfig.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {ruleConfig.options.map(option => (
                        <Badge
                          key={option}
                          variant={field.rules[ruleKey]?.includes(option) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const current = field.rules[ruleKey] || [];
                            const updated = current.includes(option)
                              ? current.filter((item: string) => item !== option)
                              : [...current, option];
                            setField(prev => ({
                              ...prev,
                              rules: { ...prev.rules, [ruleKey]: updated }
                            }));
                          }}
                        >
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {Object.keys(availableRules).length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No validation rules available for {field.datatype} type
              </p>
            )}
          </CardContent>
        </Card>

        {/* Options Configuration */}
        {contractWidgetRequiresOptions(field.widget) && (
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