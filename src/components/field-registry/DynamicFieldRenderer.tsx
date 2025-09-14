import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FieldRegistry {
  id: string;
  field_id: string;
  datatype: string;
  widget: string;
  options: any;
  rules: any;
  ui: any;
  default_value: any;
  resolvedOptions?: any[];
}

interface DynamicFieldRendererProps {
  field: FieldRegistry;
  value: any;
  onChange: (value: any) => void;
}

export function DynamicFieldRenderer({ field, value, onChange }: DynamicFieldRendererProps) {
  const getLabel = () => field.ui?.label?.fallback || field.field_id;
  const getPlaceholder = () => field.ui?.placeholder?.fallback || '';

  const renderByWidget = () => {
    switch (field.widget) {
      case 'text':
        return (
          <Input
            placeholder={getPlaceholder()}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            type={field.datatype === 'number' ? 'number' : 'text'}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={getPlaceholder()}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={getPlaceholder() || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.resolvedOptions?.map((option, index) => (
                <SelectItem key={index} value={String(option.value)}>
                  {option.label.fallback}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup value={value || ''} onValueChange={onChange}>
            {field.resolvedOptions?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={String(option.value)} id={`${field.field_id}-${index}`} />
                <Label htmlFor={`${field.field_id}-${index}`}>
                  {option.label.fallback}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        if (field.datatype === 'array' && field.resolvedOptions) {
          const selectedValues = Array.isArray(value) ? value : [];
          return (
            <div className="space-y-2">
              {field.resolvedOptions.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.field_id}-${index}`}
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onChange([...selectedValues, option.value]);
                      } else {
                        onChange(selectedValues.filter((v: any) => v !== option.value));
                      }
                    }}
                  />
                  <Label htmlFor={`${field.field_id}-${index}`}>
                    {option.label.fallback}
                  </Label>
                </div>
              ))}
            </div>
          );
        }
        // Single checkbox for boolean
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.field_id}
              checked={!!value}
              onCheckedChange={onChange}
            />
            <Label htmlFor={field.field_id}>{getLabel()}</Label>
          </div>
        );

      case 'tags':
        const tagValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-3">
            {/* Selected tags */}
            {tagValues.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tagValues.map((tagValue: any, index: number) => {
                  const option = field.resolvedOptions?.find(opt => opt.value === tagValue);
                  return (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {option?.label.fallback || tagValue}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => {
                          onChange(tagValues.filter((_: any, i: number) => i !== index));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            )}
            
            {/* Available options to add */}
            <Select
              value=""
              onValueChange={(selectedValue) => {
                if (!tagValues.includes(selectedValue)) {
                  onChange([...tagValues, selectedValue]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add tag..." />
              </SelectTrigger>
              <SelectContent>
                {field.resolvedOptions
                  ?.filter(option => !tagValues.includes(option.value))
                  .map((option, index) => (
                    <SelectItem key={index} value={String(option.value)}>
                      {option.label.fallback}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            placeholder={getPlaceholder() || 'https://example.com'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="w-16"
            />
            <Input
              type="text"
              placeholder="#000000"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="font-mono"
            />
          </div>
        );

      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // For demo purposes, just store the file name
                onChange(file.name);
              }
            }}
          />
        );

      default:
        return (
          <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
            Unsupported widget type: {field.widget}
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{getLabel()}</Label>
      {renderByWidget()}
    </div>
  );
}