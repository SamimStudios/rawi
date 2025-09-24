import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldEntry } from '@/hooks/useFields';

interface SystematicFieldRendererProps {
  field: FieldEntry;
  value?: any;
  onChange: (value: any) => void;
  className?: string;
}

export default function SystematicFieldRenderer({ 
  field, 
  value, 
  onChange, 
  className 
}: SystematicFieldRendererProps) {
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  // Extract field properties
  const label = field.ui?.label?.fallback || field.ui?.label?.key || field.id;
  const placeholder = field.ui?.placeholder?.fallback || field.ui?.placeholder?.key || '';
  const help = field.ui?.help?.fallback || field.ui?.help?.key || '';
  const isRequired = field.rules?.required === true;
  const defaultValue = field.default_value;

  // Initialize value if not provided
  useEffect(() => {
    if (value === undefined && defaultValue !== undefined) {
      onChange(defaultValue);
    }
  }, [value, defaultValue, onChange]);

  // Validation function
  const validateValue = useCallback((val: any) => {
    const rules = field.rules || {};
    let errorMsg = null;

    // Required check
    if (rules.required && (!val || (typeof val === 'string' && val.trim() === ''))) {
      errorMsg = `${label} is required`;
    }

    // String validations
    if (val && typeof val === 'string') {
      if (rules.minLength && val.length < rules.minLength) {
        errorMsg = `${label} must be at least ${rules.minLength} characters`;
      }
      if (rules.maxLength && val.length > rules.maxLength) {
        errorMsg = `${label} must be no more than ${rules.maxLength} characters`;
      }
      if (rules.pattern && !new RegExp(rules.pattern).test(val)) {
        errorMsg = `${label} format is invalid`;
      }
      setCharCount(val.length);
    }

    // Array validations
    if (Array.isArray(val)) {
      if (rules.minItems && val.length < rules.minItems) {
        errorMsg = `${label} must have at least ${rules.minItems} items`;
      }
      if (rules.maxItems && val.length > rules.maxItems) {
        errorMsg = `${label} must have no more than ${rules.maxItems} items`;
      }
    }

    // Number validations
    if (typeof val === 'number') {
      if (rules.min && val < rules.min) {
        errorMsg = `${label} must be at least ${rules.min}`;
      }
      if (rules.max && val > rules.max) {
        errorMsg = `${label} must be no more than ${rules.max}`;
      }
    }

    setError(errorMsg);
    return !errorMsg;
  }, [field.rules, label]);

  // Handle value change with validation
  const handleChange = useCallback((newValue: any) => {
    onChange(newValue);
    validateValue(newValue);
  }, [onChange, validateValue]);

  // Render different widgets based on field.widget
  const renderWidget = () => {
    const currentValue = value !== undefined ? value : defaultValue;

    switch (field.widget) {
      case 'text':
        return (
          <div className="space-y-1">
            <Input
              value={currentValue || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              className={cn(error && "border-destructive")}
            />
            {(field.rules?.maxLength || field.rules?.minLength) && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {field.rules?.minLength && `Min: ${field.rules.minLength}`}
                  {field.rules?.minLength && field.rules?.maxLength && ' • '}
                  {field.rules?.maxLength && `Max: ${field.rules.maxLength}`}
                </span>
                {field.rules?.maxLength && (
                  <span className={cn(
                    charCount > field.rules.maxLength ? "text-destructive" : "",
                    charCount > field.rules.maxLength * 0.9 ? "text-warning" : ""
                  )}>
                    {charCount}/{field.rules.maxLength}
                  </span>
                )}
              </div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-1">
            <Textarea
              value={currentValue || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              className={cn(error && "border-destructive")}
              rows={4}
            />
            {field.rules?.maxLength && (
              <div className="flex justify-end text-xs text-muted-foreground">
                <span className={cn(
                  charCount > field.rules.maxLength ? "text-destructive" : "",
                  charCount > field.rules.maxLength * 0.9 ? "text-warning" : ""
                )}>
                  {charCount}/{field.rules.maxLength}
                </span>
              </div>
            )}
          </div>
        );

      case 'select':
        const options = field.options?.values || [];
        return (
          <Select 
            value={currentValue || ''} 
            onValueChange={handleChange}
          >
            <SelectTrigger className={cn(error && "border-destructive")}>
              <SelectValue placeholder={placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: any, index: number) => (
                <SelectItem key={option.value || index} value={option.value}>
                  {option.label?.fallback || option.label || option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        const radioOptions = field.options?.values || [];
        return (
          <RadioGroup 
            value={currentValue || ''} 
            onValueChange={handleChange}
            className={cn(error && "border border-destructive rounded-md p-2")}
          >
            {radioOptions.map((option: any, index: number) => (
              <div key={option.value || index} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${index}`} />
                <Label htmlFor={`${field.id}-${index}`}>
                  {option.label?.fallback || option.label || option.value}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className={cn("flex items-center space-x-2", error && "text-destructive")}>
            <Checkbox
              checked={currentValue || false}
              onCheckedChange={handleChange}
              id={field.id}
            />
            <Label htmlFor={field.id}>{label}</Label>
          </div>
        );

      case 'tags':
        const tagsOptions = field.options?.values || [];
        const selectedTags = Array.isArray(currentValue) ? currentValue : [];
        
        const toggleTag = (tagValue: string) => {
          const newTags = selectedTags.includes(tagValue)
            ? selectedTags.filter(t => t !== tagValue)
            : [...selectedTags, tagValue];
          handleChange(newTags);
        };

        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
              {selectedTags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 w-4 h-4"
                    onClick={() => toggleTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {selectedTags.length === 0 && (
                <span className="text-muted-foreground text-sm">
                  {placeholder || 'Select tags'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {tagsOptions
                .filter((option: any) => !selectedTags.includes(option.value))
                .map((option: any, index: number) => (
                  <Button
                    key={option.value || index}
                    variant="outline"
                    size="sm"
                    onClick={() => toggleTag(option.value)}
                    className="h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {option.label?.fallback || option.label || option.value}
                  </Button>
                ))}
            </div>
            {field.rules?.minItems && selectedTags.length < field.rules.minItems && (
              <p className="text-xs text-muted-foreground">
                Select at least {field.rules.minItems} items
              </p>
            )}
            {field.rules?.maxItems && (
              <p className="text-xs text-muted-foreground">
                {selectedTags.length}/{field.rules.maxItems} selected
              </p>
            )}
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={currentValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={cn(error && "border-destructive")}
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={currentValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={cn(error && "border-destructive")}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={currentValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className={cn(error && "border-destructive")}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            value={currentValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className={cn(error && "border-destructive")}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={currentValue || ''}
            onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : '')}
            placeholder={placeholder}
            min={field.rules?.min}
            max={field.rules?.max}
            className={cn(error && "border-destructive")}
          />
        );

      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleChange({ name: file.name, size: file.size, type: file.type });
              }
            }}
            className={cn(error && "border-destructive")}
          />
        );

      default:
        return (
          <div className="p-4 border border-dashed rounded-md">
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Unsupported widget type: {field.widget}
            </p>
            <pre className="text-xs mt-2 bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(field, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {field.widget !== 'checkbox' && (
        <Label htmlFor={field.id} className="flex items-center gap-1">
          {label}
          {isRequired && <span className="text-destructive">*</span>}
          {help && (
            <span className="text-xs text-muted-foreground ml-2">
              ({help})
            </span>
          )}
        </Label>
      )}
      
      {renderWidget()}
      
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}