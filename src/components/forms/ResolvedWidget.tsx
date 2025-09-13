import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { ResolvedField } from '@/hooks/useFieldResolver';

interface ResolvedWidgetProps {
  field: ResolvedField;
}

interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

const TagsInput: React.FC<TagsInputProps> = ({ value = [], onChange, options, placeholder }) => {
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
            .filter(option => !value.includes(option.value) && !option.disabled)
            .map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
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
                {option?.label || tag}
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

export const ResolvedWidget: React.FC<ResolvedWidgetProps> = ({ field }) => {
  const { control } = useFormContext();
  
  const renderWidget = () => {
    const commonProps = {
      name: field.id,
      control,
      defaultValue: field.value
    };

    switch (field.widget) {
      case 'text':
        return (
          <Controller
            {...commonProps}
            rules={{
              required: field.required ? `${field.label} is required` : false,
              minLength: field.rules?.minLength ? {
                value: field.rules.minLength,
                message: `Minimum ${field.rules.minLength} characters required`
              } : undefined,
              maxLength: field.rules?.maxLength ? {
                value: field.rules.maxLength,
                message: `Maximum ${field.rules.maxLength} characters allowed`
              } : undefined,
              pattern: field.rules?.pattern ? {
                value: new RegExp(field.rules.pattern),
                message: 'Must match the required pattern'
              } : undefined
            }}
            render={({ field: controllerField }) => (
              <Input
                {...controllerField}
                type={field.datatype === 'url' ? 'url' : field.datatype === 'number' ? 'number' : 'text'}
                placeholder={field.placeholder}
                disabled={!field.editable}
                className={!field.valid ? 'border-destructive' : ''}
              />
            )}
          />
        );

      case 'textarea':
        return (
          <Controller
            {...commonProps}
            rules={{
              required: field.required ? `${field.label} is required` : false,
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
                placeholder={field.placeholder}
                disabled={!field.editable}
                className={!field.valid ? 'border-destructive' : ''}
              />
            )}
          />
        );

      case 'select':
        return (
          <Controller
            {...commonProps}
            rules={{
              required: field.required ? `${field.label} is required` : false
            }}
            render={({ field: controllerField }) => (
              <Select 
                onValueChange={controllerField.onChange} 
                value={controllerField.value}
                disabled={!field.editable}
              >
                <SelectTrigger className={!field.valid ? 'border-destructive' : ''}>
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        );

      case 'radio':
        return (
          <Controller
            {...commonProps}
            rules={{
              required: field.required ? `${field.label} is required` : false
            }}
            render={({ field: controllerField }) => (
              <RadioGroup
                onValueChange={controllerField.onChange}
                value={controllerField.value}
                disabled={!field.editable}
                className={!field.valid ? 'border border-destructive rounded p-2' : ''}
              >
                {field.options?.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option.value} 
                      id={`${field.id}-${option.value}`}
                      disabled={option.disabled || !field.editable}
                    />
                    <Label htmlFor={`${field.id}-${option.value}`}>
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        );

      case 'checkbox':
        return (
          <Controller
            {...commonProps}
            rules={{
              required: field.required ? `${field.label} is required` : false
            }}
            render={({ field: controllerField }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.id}
                  checked={controllerField.value || false}
                  onCheckedChange={controllerField.onChange}
                  disabled={!field.editable}
                  className={!field.valid ? 'border-destructive' : ''}
                />
                <Label htmlFor={field.id}>{field.label}</Label>
              </div>
            )}
          />
        );

      case 'tags':
        return (
          <Controller
            {...commonProps}
            rules={{
              required: field.required ? `${field.label} is required` : false,
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
                options={field.options || []}
                placeholder={field.placeholder}
              />
            )}
          />
        );

      case 'file':
        return (
          <Controller
            {...commonProps}
            rules={{
              required: field.required ? `${field.label} is required` : false
            }}
            render={({ field: controllerField }) => (
              <div className="space-y-2">
                <Input
                  {...controllerField}
                  type="url"
                  placeholder={field.placeholder || "Enter file URL..."}
                  disabled={!field.editable}
                  className={!field.valid ? 'border-destructive' : ''}
                />
                {controllerField.value && (
                  <div className="text-sm text-muted-foreground">
                    Preview: <a href={controllerField.value} target="_blank" rel="noopener noreferrer" className="underline">
                      {controllerField.value}
                    </a>
                  </div>
                )}
              </div>
            )}
          />
        );

      default:
        return (
          <Controller
            {...commonProps}
            rules={{
              required: field.required ? `${field.label} is required` : false
            }}
            render={({ field: controllerField }) => (
              <Input
                {...controllerField}
                placeholder={field.placeholder}
                disabled={!field.editable}
                className={!field.valid ? 'border-destructive' : ''}
              />
            )}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {field.widget !== 'checkbox' && (
        <Label htmlFor={field.id} className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {renderWidget()}
      {field.errors.length > 0 && (
        <div className="space-y-1">
          {field.errors.map((error, index) => (
            <p key={index} className="text-sm text-destructive">
              {error}
            </p>
          ))}
        </div>
      )}
      {field.help && (
        <p className="text-sm text-muted-foreground">
          {field.help}
        </p>
      )}
    </div>
  );
};