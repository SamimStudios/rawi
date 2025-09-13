import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { startCase } from 'lodash';
import { FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FieldItem, FieldRegistry } from '@/hooks/useNodeDefinitionMock';

interface DynamicFormFieldProps {
  fieldItem: FieldItem;
  registry: FieldRegistry;
  control: Control<any>;
}

export function DynamicFormField({ fieldItem, registry, control }: DynamicFormFieldProps) {
  // Resolve field properties
  const label = fieldItem.label || registry.ui?.label?.fallback || startCase(fieldItem.ref);
  const prompt = fieldItem.prompt || registry.ui?.help?.fallback || '';
  const required = registry.rules?.required === true;
  const widget = registry.widget;

  // Field validation rules
  const rules: any = {};
  if (required) {
    rules.required = `${label} is required`;
  }
  
  if (registry.rules?.minLength) {
    rules.minLength = {
      value: registry.rules.minLength,
      message: `${label} must be at least ${registry.rules.minLength} characters`
    };
  }
  
  if (registry.rules?.maxLength) {
    rules.maxLength = {
      value: registry.rules.maxLength,
      message: `${label} must be no more than ${registry.rules.maxLength} characters`
    };
  }

  return (
    <Controller
      name={fieldItem.ref}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <FieldWidget
              widget={widget}
              field={field}
              registry={registry}
              fieldItem={fieldItem}
              error={fieldState.error}
            />
          </FormControl>
          {prompt && (
            <FormDescription>{prompt}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface FieldWidgetProps {
  widget: string;
  field: any;
  registry: FieldRegistry;
  fieldItem: FieldItem;
  error?: any;
}

function FieldWidget({ widget, field, registry, fieldItem, error }: FieldWidgetProps) {
  const { value, onChange, ...fieldProps } = field;

  switch (widget) {
    case 'text':
    case 'url':
      return (
        <Input
          {...fieldProps}
          type={widget === 'url' ? 'url' : 'text'}
          value={value || ''}
          onChange={onChange}
          className={error ? 'border-destructive' : ''}
        />
      );

    case 'textarea':
      return (
        <Textarea
          {...fieldProps}
          value={value || ''}
          onChange={onChange}
          className={error ? 'border-destructive' : ''}
          rows={3}
        />
      );

    case 'select':
      if (!registry.options?.values) {
        return (
          <div className="space-y-2">
            <Input
              {...fieldProps}
              value={value || ''}
              onChange={onChange}
              className="border-orange-300"
            />
            <p className="text-xs text-orange-600">
              Warning: No options configured for select field
            </p>
          </div>
        );
      }
      
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className={error ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {registry.options.values.map((option: any) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label?.fallback || option.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'radio':
      if (!registry.options?.values) {
        return (
          <div className="space-y-2">
            <Input
              {...fieldProps}
              value={value || ''}
              onChange={onChange}
              className="border-orange-300"
            />
            <p className="text-xs text-orange-600">
              Warning: No options configured for radio field
            </p>
          </div>
        );
      }
      
      return (
        <RadioGroup value={value || ''} onValueChange={onChange}>
          <div className="flex flex-wrap gap-4">
            {registry.options.values.map((option: any) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${fieldItem.ref}-${option.value}`} />
                <Label htmlFor={`${fieldItem.ref}-${option.value}`}>
                  {option.label?.fallback || option.value}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      );

    case 'tags':
      return (
        <TagsWidget
          value={value || []}
          onChange={onChange}
          options={registry.options}
          fieldRef={fieldItem.ref}
          error={error}
        />
      );

    case 'file':
      return (
        <Input
          {...fieldProps}
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            onChange(file);
          }}
          className={error ? 'border-destructive' : ''}
        />
      );

    default:
      return (
        <div className="space-y-2">
          <Input
            {...fieldProps}
            value={value || ''}
            onChange={onChange}
            className="border-orange-300"
            disabled
          />
          <p className="text-xs text-orange-600">
            Unknown widget type: {widget}
          </p>
        </div>
      );
  }
}

interface TagsWidgetProps {
  value: string[];
  onChange: (value: string[]) => void;
  options?: any;
  fieldRef: string;
  error?: any;
}

function TagsWidget({ value, onChange, options, fieldRef, error }: TagsWidgetProps) {
  const maxTags = fieldRef === 'genres' ? 3 : options?.rules?.maxItems || 10;
  const canAddMore = value.length < maxTags;

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : canAddMore
      ? [...value, optionValue]
      : value;
    
    onChange(newValue);
  };

  if (!options?.values) {
    return (
      <div className="space-y-2">
        <Input
          value={value.join(', ')}
          onChange={(e) => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          placeholder="Enter values separated by commas"
          className="border-orange-300"
        />
        <p className="text-xs text-orange-600">
          Warning: No options configured for tags field
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.values.map((option: any) => {
          const isSelected = value.includes(option.value);
          const canSelect = canAddMore || isSelected;
          
          return (
            <Badge
              key={option.value}
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors',
                canSelect 
                  ? 'hover:bg-primary hover:text-primary-foreground' 
                  : 'opacity-50 cursor-not-allowed',
                error && 'border-destructive'
              )}
              onClick={() => {
                if (canSelect) {
                  handleToggle(option.value);
                }
              }}
            >
              {option.label?.fallback || option.value}
            </Badge>
          );
        })}
      </div>
      
      {fieldRef === 'genres' && (
        <p className="text-sm text-muted-foreground">
          Select up to {maxTags} genres ({value.length}/{maxTags})
        </p>
      )}
    </div>
  );
}