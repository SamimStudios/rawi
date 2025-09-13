import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { FieldRegistryEntry } from '@/hooks/useFieldRegistry';

interface DynamicWidgetProps {
  field: FieldRegistryEntry;
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: Array<{ value: string; label: any }>;
  placeholder?: string;
}

const TagsInput: React.FC<TagsInputProps> = ({ value = [], onChange, options, placeholder }) => {
  const [inputValue, setInputValue] = React.useState('');

  const addTag = (tagValue: string) => {
    if (tagValue && !value.includes(tagValue)) {
      onChange([...value, tagValue]);
    }
  };

  const removeTag = (tagValue: string) => {
    onChange(value.filter(tag => tag !== tagValue));
  };

  return (
    <div className="space-y-2">
      <Select onValueChange={addTag}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || "Select tags..."} />
        </SelectTrigger>
        <SelectContent>
          {options
            .filter(option => !value.includes(option.value))
            .map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label.fallback || option.value}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => {
            const option = options.find(opt => opt.value === tag);
            return (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {option?.label.fallback || tag}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const DynamicWidget: React.FC<DynamicWidgetProps> = ({ 
  field, 
  name, 
  label, 
  placeholder,
  required 
}) => {
  const { control, formState: { errors } } = useFormContext();
  
  const fieldError = errors[name];
  const displayLabel = label || field.ui?.label?.fallback || field.field_id;
  const displayPlaceholder = placeholder || field.ui?.placeholder?.fallback;

  const renderWidget = () => {
    switch (field.widget) {
      case 'text':
        return (
          <Controller
            name={name}
            control={control}
            defaultValue={field.default_value || ''}
            rules={{
              required: required ? `${displayLabel} is required` : false,
              minLength: field.rules?.minLength ? {
                value: field.rules.minLength,
                message: `Minimum ${field.rules.minLength} characters required`
              } : undefined,
              maxLength: field.rules?.maxLength ? {
                value: field.rules.maxLength,
                message: `Maximum ${field.rules.maxLength} characters allowed`
              } : undefined
            }}
            render={({ field: controllerField }) => (
              <Input
                {...controllerField}
                placeholder={displayPlaceholder}
                className={fieldError ? 'border-destructive' : ''}
              />
            )}
          />
        );

      case 'textarea':
        return (
          <Controller
            name={name}
            control={control}
            defaultValue={field.default_value || ''}
            rules={{
              required: required ? `${displayLabel} is required` : false,
              minLength: field.rules?.minLength ? {
                value: field.rules.minLength,
                message: `Minimum ${field.rules.minLength} characters required`
              } : undefined,
              maxLength: field.rules?.maxLength ? {
                value: field.rules.maxLength,
                message: `Maximum ${field.rules.maxLength} characters allowed`
              } : undefined
            }}
            render={({ field: controllerField }) => (
              <Textarea
                {...controllerField}
                placeholder={displayPlaceholder}
                className={fieldError ? 'border-destructive' : ''}
              />
            )}
          />
        );

      case 'select':
        const selectOptions = field.options?.values || [];
        return (
          <Controller
            name={name}
            control={control}
            defaultValue={field.default_value || ''}
            rules={{
              required: required ? `${displayLabel} is required` : false
            }}
            render={({ field: controllerField }) => (
              <Select onValueChange={controllerField.onChange} value={controllerField.value}>
                <SelectTrigger className={fieldError ? 'border-destructive' : ''}>
                  <SelectValue placeholder={displayPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.map((option: any) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label?.fallback || option.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        );

      case 'radio':
        const radioOptions = field.options?.values || [];
        return (
          <Controller
            name={name}
            control={control}
            defaultValue={field.default_value || ''}
            rules={{
              required: required ? `${displayLabel} is required` : false
            }}
            render={({ field: controllerField }) => (
              <RadioGroup
                onValueChange={controllerField.onChange}
                value={controllerField.value}
                className={fieldError ? 'border border-destructive rounded p-2' : ''}
              >
                {radioOptions.map((option: any) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value}>
                      {option.label?.fallback || option.value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        );

      case 'tags':
        const tagOptions = field.options?.values || [];
        return (
          <Controller
            name={name}
            control={control}
            defaultValue={field.default_value || []}
            rules={{
              required: required ? `${displayLabel} is required` : false,
              validate: {
                maxItems: (value) => {
                  if (field.rules?.maxItems && value?.length > field.rules.maxItems) {
                    return `Maximum ${field.rules.maxItems} items allowed`;
                  }
                  return true;
                },
                minItems: (value) => {
                  if (field.rules?.minItems && value?.length < field.rules.minItems) {
                    return `Minimum ${field.rules.minItems} items required`;
                  }
                  return true;
                }
              }
            }}
            render={({ field: controllerField }) => (
              <TagsInput
                value={controllerField.value || []}
                onChange={controllerField.onChange}
                options={tagOptions}
                placeholder={displayPlaceholder}
              />
            )}
          />
        );

      case 'file':
        return (
          <Controller
            name={name}
            control={control}
            defaultValue={field.default_value || ''}
            rules={{
              required: required ? `${displayLabel} is required` : false
            }}
            render={({ field: controllerField }) => (
              <Input
                {...controllerField}
                type="url"
                placeholder={displayPlaceholder || "Enter file URL..."}
                className={fieldError ? 'border-destructive' : ''}
              />
            )}
          />
        );

      default:
        // Fallback to text input for unknown widgets
        return (
          <Controller
            name={name}
            control={control}
            defaultValue={field.default_value || ''}
            rules={{
              required: required ? `${displayLabel} is required` : false
            }}
            render={({ field: controllerField }) => (
              <Input
                {...controllerField}
                placeholder={displayPlaceholder}
                className={fieldError ? 'border-destructive' : ''}
              />
            )}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium">
        {displayLabel}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderWidget()}
      {fieldError && (
        <p className="text-sm text-destructive">
          {fieldError.message as string}
        </p>
      )}
      {field.ui?.help?.fallback && (
        <p className="text-sm text-muted-foreground">
          {field.ui.help.fallback}
        </p>
      )}
    </div>
  );
};