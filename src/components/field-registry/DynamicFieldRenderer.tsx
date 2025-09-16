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
  disabled?: boolean;
}

interface ValidationError {
  message: string;
  type: string;
}

export function DynamicFieldRenderer({ field, value, onChange, formValues = {}, disabled = false }: DynamicFieldRendererProps) {
  const { t } = useLanguage();
  
  // Validation logic
  const validateField = (fieldValue: any): ValidationError | null => {
    const rules = field.rules || {};
    
    // String-based validations (string, uuid, url, date, datetime)
    if (['string', 'uuid', 'url', 'date', 'datetime'].includes(field.datatype) && typeof fieldValue === 'string') {
      // minLength validation
      if (rules.minLength !== undefined && fieldValue.length < rules.minLength) {
        return {
          message: t('fieldTooShort') || `Minimum ${rules.minLength} characters required`,
          type: 'minLength'
        };
      }
      
      // maxLength validation
      if (rules.maxLength !== undefined && fieldValue.length > rules.maxLength) {
        return {
          message: t('fieldTooLong') || `Maximum ${rules.maxLength} characters allowed`,
          type: 'maxLength'
        };
      }
      
      // Pattern validation
      if (rules.pattern && fieldValue) {
        try {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(fieldValue)) {
            return {
              message: t('invalidFormat') || 'Invalid format',
              type: 'pattern'
            };
          }
        } catch (e) {
          // Invalid regex pattern - skip validation
        }
      }
      
      // Format validation
      if (rules.format && fieldValue) {
        switch (rules.format) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(fieldValue)) {
              return {
                message: t('invalidEmail') || 'Please enter a valid email address',
                type: 'format'
              };
            }
            break;
          case 'phone':
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(fieldValue.replace(/[\s\-\(\)]/g, ''))) {
              return {
                message: t('invalidPhone') || 'Please enter a valid phone number',
                type: 'format'
              };
            }
            break;
          case 'url':
          case 'uri':
            try {
              new URL(fieldValue);
            } catch {
              return {
                message: t('invalidUrl') || 'Please enter a valid URL',
                type: 'format'
              };
            }
            break;
          case 'color':
            const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
            if (!colorRegex.test(fieldValue)) {
              return {
                message: t('invalidColor') || 'Please enter a valid color code',
                type: 'format'
              };
            }
            break;
        }
      }
    }
    
    // Number validation
    if (field.datatype === 'number' && fieldValue !== '' && fieldValue != null) {
      const numValue = Number(fieldValue);
      if (isNaN(numValue)) {
        return {
          message: t('invalidNumber') || 'Please enter a valid number',
          type: 'invalidNumber'
        };
      }
      
      // minimum validation
      if (rules.minimum !== undefined && numValue < rules.minimum) {
        return {
          message: t('numberTooSmall') || `Minimum value is ${rules.minimum}`,
          type: 'minimum'
        };
      }
      
      // maximum validation
      if (rules.maximum !== undefined && numValue > rules.maximum) {
        return {
          message: t('numberTooLarge') || `Maximum value is ${rules.maximum}`,
          type: 'maximum'
        };
      }
    }
    
    // Array validation
    if (field.datatype === 'array' && Array.isArray(fieldValue)) {
      // minItems validation
      if (rules.minItems !== undefined && fieldValue.length < rules.minItems) {
        return {
          message: t('tooFewItems') || `Please select at least ${rules.minItems} items`,
          type: 'minItems'
        };
      }
      
      // maxItems validation
      if (rules.maxItems !== undefined && fieldValue.length > rules.maxItems) {
        return {
          message: t('tooManyItems') || `Please select no more than ${rules.maxItems} items`,
          type: 'maxItems'
        };
      }
      
      // uniqueItems validation
      if (rules.uniqueItems && fieldValue.length !== new Set(fieldValue).size) {
        return {
          message: t('duplicateItems') || 'All items must be unique',
          type: 'uniqueItems'
        };
      }
    }
    
    // URL widget specific validation (fallback for non-url datatype)
    if (field.widget === 'url' && fieldValue && typeof fieldValue === 'string') {
      try {
        new URL(fieldValue);
      } catch {
        return {
          message: t('invalidUrl') || 'Please enter a valid URL',
          type: 'invalidUrl'
        };
      }
    }
    
    return null;
  };

  const validationError = validateField(value);
  
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
    // Try resolvedOptions first, then fall back to raw options for static sources
    let options = field.resolvedOptions;
    
    if (!options && field.options?.source === 'static' && field.options?.values) {
      options = field.options.values;
    }
    
    if (!options) return [];

    return options.filter(option => {
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
            disabled={disabled}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={getPlaceholder()}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            disabled={disabled}
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
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
          <RadioGroup value={value || ''} onValueChange={onChange} disabled={disabled}>
            {filteredOptions.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={String(option.value)} id={`${field.field_id}-${index}`} disabled={disabled} />
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
                    disabled={disabled}
                    onCheckedChange={(checked) => {
                      if (disabled) return;
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
              disabled={disabled}
              onCheckedChange={disabled ? undefined : onChange}
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
                      {!disabled && (
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
                      )}
                    </Badge>
                  );
                })}
              </div>
            )}
            
            {/* Available options as clickable chips */}
            {!disabled && (
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
            )}
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        );

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            placeholder={getPlaceholder() || t('enterUrl') || 'https://example.com'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
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
              disabled={disabled}
            />
            <Input
              type="text"
              placeholder={t('colorHex') || '#000000'}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="font-mono"
              disabled={disabled}
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
            disabled={disabled}
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
      <Label className="text-sm font-medium flex items-center gap-1">
        {getLabel()}
        {field.rules?.required && (
          <span className="text-red-500">*</span>
        )}
      </Label>
      {renderByWidget()}
      {validationError && (
        <p className="text-sm text-red-500 font-medium">
          {validationError.message}
        </p>
      )}
    </div>
  );
}