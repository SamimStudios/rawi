import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Upload, File, Image, FileText, Music, Video } from 'lucide-react';
import { FileUploadField } from './FileUploadField';
import { useLanguage } from '@/contexts/LanguageContext';

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
  formValues?: Record<string, any>;
}

export function DynamicFieldRenderer({ field, value, onChange, formValues = {} }: DynamicFieldRendererProps) {
  const { t } = useLanguage();
  
  const getLabel = () => {
    const labelData = field.ui?.label;
    return labelData?.key ? t(labelData.key) : (labelData?.fallback || field.field_id);
  };
  
  const getPlaceholder = () => {
    const placeholderData = field.ui?.placeholder;
    return placeholderData?.key ? t(placeholderData.key) : (placeholderData?.fallback || '');
  };

  // Filter options based on dependsOn conditions
  const getFilteredOptions = () => {
    if (!field.resolvedOptions) return [];

    return field.resolvedOptions.filter(option => {
      // If no dependsOn, include the option
      if (!option.dependsOn || !Array.isArray(option.dependsOn)) {
        return true;
      }

      // Check all dependencies - ALL must be satisfied
      return option.dependsOn.every((dep: any) => {
        const parentFieldValue = formValues[dep.field];
        const allowedValues = dep.allow || [];
        
        // If parent field has no value, don't show dependent options
        if (!parentFieldValue) return false;
        
        // Check if current parent value is in allowed values
        return allowedValues.includes(parentFieldValue);
      });
    });
  };

  const filteredOptions = getFilteredOptions();

  const renderByWidget = () => {
    switch (field.widget) {
      case 'text':
        return (
          <Input
            placeholder={getPlaceholder() || t('enterUrl') || 'https://example.com'}
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
              <SelectValue placeholder={getPlaceholder() || t('selectOption') || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {filteredOptions.map((option, index) => (
                <SelectItem key={index} value={String(option.value)}>
                  {option.label?.key ? t(option.label.key) : option.label?.fallback}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup value={value || ''} onValueChange={onChange}>
            {filteredOptions.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={String(option.value)} id={`${field.field_id}-${index}`} />
                <Label htmlFor={`${field.field_id}-${index}`}>
                  {option.label?.key ? t(option.label.key) : option.label?.fallback}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        if (field.datatype === 'array' && filteredOptions.length > 0) {
          const selectedValues = Array.isArray(value) ? value : [];
          return (
            <div className="space-y-2">
              {filteredOptions.map((option, index) => (
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
                    {option.label?.key ? t(option.label.key) : option.label?.fallback}
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
                  const option = filteredOptions.find(opt => opt.value === tagValue);
                  const optionLabel = option?.label?.key ? t(option.label.key) : (option?.label?.fallback || tagValue);
                  return (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {optionLabel}
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
            
            {/* Available options as clickable chips */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('availableOptions') || 'Available options:'}
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredOptions
                  .filter(option => !tagValues.includes(option.value))
                  .map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        onChange([...tagValues, option.value]);
                      }}
                    >
                      {option.label?.key ? t(option.label.key) : option.label?.fallback}
                    </Button>
                  ))}
              </div>
            </div>
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
            placeholder={getPlaceholder() || t('enterUrl') || 'https://example.com'}
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
              placeholder={t('colorHex') || '#000000'}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="font-mono"
            />
          </div>
        );

      case 'file':
        return (
          <FileUploadField
            value={value}
            onChange={onChange}
            placeholder={getPlaceholder()}
            field={field}
          />
        );

      default:
        return (
          <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
            {t('unsupportedWidget') || 'Unsupported widget type'}: {field.widget}
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