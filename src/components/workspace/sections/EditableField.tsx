import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { WorkspaceField } from '@/config/workspace';
import { useLanguage } from '@/contexts/LanguageContext';

interface EditableFieldProps {
  field: WorkspaceField;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function EditableField({
  field,
  value,
  onChange,
  disabled = false,
  error = false,
  className
}: EditableFieldProps) {
  const { t } = useLanguage();
  
  const fieldClasses = cn(
    disabled && "bg-muted/50 cursor-default",
    error && "border-red-500",
    className
  );

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholderKey ? t(field.placeholderKey) : ''}
            disabled={disabled}
            className={fieldClasses}
          />
        );
        
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholderKey ? t(field.placeholderKey) : ''}
            disabled={disabled}
            rows={4}
            className={cn(fieldClasses, disabled && "resize-none")}
          />
        );
        
      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={fieldClasses}>
              <SelectValue placeholder={field.placeholderKey ? t(field.placeholderKey) : t('selectOption')} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      default:
        return (
          <div className="text-sm text-muted-foreground">
            Unsupported field type: {field.type}
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {t(field.labelKey)}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
    </div>
  );
}