import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';

interface FieldRendererProps {
  field: any;
  value?: any;
  onChange: (value: any) => void;
}

export default function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const getFieldLabel = () => {
    if (field.ui?.label) {
      return field.ui.label.fallback || field.ui.label.key || field.id;
    }
    return field.id;
  };

  const getFieldPlaceholder = () => {
    if (field.ui?.placeholder) {
      return field.ui.placeholder.fallback || field.ui.placeholder.key || '';
    }
    return '';
  };

  const getFieldHelp = () => {
    if (field.ui?.help) {
      return field.ui.help.fallback || field.ui.help.key || '';
    }
    return '';
  };

  const isRequired = () => {
    return field.rules?.required === true;
  };

  const renderTextInput = () => (
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={getFieldPlaceholder()}
      required={isRequired()}
    />
  );

  const renderTextarea = () => (
    <Textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={getFieldPlaceholder()}
      required={isRequired()}
      rows={4}
    />
  );

  const renderNumber = () => (
    <Input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
      placeholder={getFieldPlaceholder()}
      required={isRequired()}
      min={field.rules?.min}
      max={field.rules?.max}
    />
  );

  const renderSelect = () => {
    const options = field.options?.values || [];
    
    return (
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={getFieldPlaceholder() || 'Select an option'} />
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
  };

  const renderRadio = () => {
    const options = field.options?.values || [];
    
    return (
      <RadioGroup value={value || ''} onValueChange={onChange}>
        {options.map((option: any, index: number) => (
          <div key={option.value || index} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={`${field.id}-${index}`} />
            <Label htmlFor={`${field.id}-${index}`}>
              {option.label?.fallback || option.label || option.value}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  };

  const renderCheckbox = () => (
    <div className="flex items-center space-x-2">
      <Checkbox
        checked={value || false}
        onCheckedChange={onChange}
        id={field.id}
      />
      <Label htmlFor={field.id}>{getFieldLabel()}</Label>
    </div>
  );

  const renderMultiselect = () => {
    const options = field.options?.values || [];
    const selectedValues = Array.isArray(value) ? value : [];
    
    const toggleOption = (optionValue: string) => {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValues);
    };

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {selectedValues.map((val: string) => (
            <Badge key={val} variant="secondary">
              {val}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0"
                onClick={() => toggleOption(val)}
              >
                <Minus className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        <Select onValueChange={toggleOption}>
          <SelectTrigger>
            <SelectValue placeholder="Add option..." />
          </SelectTrigger>
          <SelectContent>
            {options
              .filter((option: any) => !selectedValues.includes(option.value))
              .map((option: any, index: number) => (
                <SelectItem key={option.value || index} value={option.value}>
                  {option.label?.fallback || option.label || option.value}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderFileUpload = () => (
    <Input
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          // TODO: Implement file upload logic
          onChange({ name: file.name, size: file.size, type: file.type });
        }
      }}
    />
  );

  const renderDate = () => (
    <Input
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      required={isRequired()}
    />
  );

  const renderTime = () => (
    <Input
      type="time"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      required={isRequired()}
    />
  );

  const renderEmail = () => (
    <Input
      type="email"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={getFieldPlaceholder()}
      required={isRequired()}
    />
  );

  const renderUrl = () => (
    <Input
      type="url"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={getFieldPlaceholder()}
      required={isRequired()}
    />
  );

  const renderField = () => {
    switch (field.widget) {
      case 'text': return renderTextInput();
      case 'textarea': return renderTextarea();
      case 'number': return renderNumber();
      case 'select': return renderSelect();
      case 'radio': return renderRadio();
      case 'checkbox': return renderCheckbox();
      case 'multiselect': return renderMultiselect();
      case 'file': return renderFileUpload();
      case 'date': return renderDate();
      case 'time': return renderTime();
      case 'email': return renderEmail();
      case 'url': return renderUrl();
      default:
        return (
          <div className="p-4 border border-dashed rounded">
            <p className="text-muted-foreground text-sm">
              Unsupported widget type: {field.widget}
            </p>
            <pre className="text-xs mt-2 bg-muted p-2 rounded">
              {JSON.stringify(field, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      {field.widget !== 'checkbox' && (
        <Label htmlFor={field.id}>
          {getFieldLabel()}
          {isRequired() && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      {renderField()}
      
      {getFieldHelp() && (
        <p className="text-xs text-muted-foreground">{getFieldHelp()}</p>
      )}
    </div>
  );
}