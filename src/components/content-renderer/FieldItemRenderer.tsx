import React, { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { DynamicFieldRenderer } from '@/components/field-registry/DynamicFieldRenderer';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

// Type definitions
interface I18nText {
  key?: string;
  fallback: string;
}

interface FieldItem {
  ref: string;
  idx: number;
  required?: boolean;
  editable?: boolean;
  importance?: "low" | "normal" | "high";
  rules?: Record<string, any>;
  repeatable?: {
    min?: number;
    max?: number;
  };
  item_instance_id?: number;
  value?: any;
  ui?: {
    override?: boolean;
    label?: I18nText;
    placeholder?: I18nText;
    help?: I18nText;
  };
}

interface FieldRegistry {
  id: string;
  datatype: string;
  widget: string;
  options: any;
  rules: any;
  ui: any;
  default_value: any;
  resolvedOptions?: Array<{
    value: string;
    label: string;
    extras?: Record<string, any>;
  }>;
}

interface FieldItemRendererProps {
  item: FieldItem;
  registry: FieldRegistry;
  isEditing: boolean;
  formValues: Record<string, any>;
  onValueChange: (fieldPath: string, value: any) => void;
  validationErrors: Record<string, string>;
  generateFieldPath: (ancestorPath: string, itemRef: string, itemInstanceId?: number, arrayIndex?: number) => string;
  ancestorPath: string;
}

// Value display component for non-editing mode
const ValueDisplay: React.FC<{ 
  value: any; 
  registry: FieldRegistry; 
  importance?: string; 
}> = ({ value, registry, importance }) => {
  const formatValue = (val: any): string => {
    if (val === null || val === undefined || val === '') {
      return '—';
    }
    
    if (typeof val === 'boolean') {
      return val ? 'Yes' : 'No';
    }
    
    if (Array.isArray(val)) {
      return val.length > 0 ? val.join(', ') : '—';
    }
    
    if (typeof val === 'object') {
      return JSON.stringify(val);
    }
    
    return String(val);
  };

  return (
    <div className="text-foreground">
      {formatValue(value)}
    </div>
  );
};

export const FieldItemRenderer: React.FC<FieldItemRendererProps> = ({
  item,
  registry,
  isEditing,
  formValues,
  onValueChange,
  validationErrors,
  generateFieldPath,
  ancestorPath
}) => {
  const { getAccentClasses } = useLanguage();

  // Generate the field path using the ltree-like structure
  const fieldPath = useMemo(() => 
    generateFieldPath(ancestorPath, item.ref, item.item_instance_id),
    [generateFieldPath, ancestorPath, item.ref, item.item_instance_id]
  );

  // Get current field value
  const fieldValue = useMemo(() => 
    formValues[fieldPath] ?? item.value ?? registry.default_value,
    [formValues, fieldPath, item.value, registry.default_value]
  );

  // Get validation error for this field
  const fieldError = validationErrors[fieldPath];

  // Label and styling utilities
  const getImportanceLabelClasses = useCallback((importance?: string) => {
    switch (importance) {
      case 'high': return 'text-lg font-bold';
      case 'low': return 'text-sm font-light text-muted-foreground';
      default: return 'text-base font-medium';
    }
  }, []);

  const getImportanceValueClasses = useCallback((importance?: string) => {
    switch (importance) {
      case 'high': return 'text-base font-semibold';
      case 'low': return 'text-sm text-muted-foreground';
      default: return 'text-base';
    }
  }, []);

  const getLabel = useCallback((item: FieldItem, registry: FieldRegistry) => {
    if (item.ui?.override && item.ui.label) {
      return item.ui.label.fallback || item.ui.label.key;
    }
    if (registry.ui?.label) {
      return registry.ui.label.fallback || registry.ui.label.key || registry.id;
    }
    return registry.id;
  }, []);

  // Repeatable field logic
  const isRepeatable = item.repeatable && item.repeatable.max && item.repeatable.max > 1;
  const repeatableValues = useMemo(() => 
    isRepeatable && Array.isArray(fieldValue) ? fieldValue : [],
    [isRepeatable, fieldValue]
  );
  
  const canAdd = useMemo(() => 
    !isRepeatable || !item.repeatable?.max || repeatableValues.length < item.repeatable.max,
    [isRepeatable, item.repeatable?.max, repeatableValues.length]
  );
  
  const canRemove = useMemo(() => 
    !isRepeatable || !item.repeatable?.min || repeatableValues.length > (item.repeatable.min || 0),
    [isRepeatable, item.repeatable?.min, repeatableValues.length]
  );

  // Event handlers
  const handleRepeatableAdd = useCallback(() => {
    toast.info('Add item instance functionality would be implemented here');
  }, []);

  const handleRepeatableRemove = useCallback((index: number) => {
    if (Array.isArray(fieldValue)) {
      const newItems = fieldValue.filter((_, i) => i !== index);
      onValueChange(fieldPath, newItems);
    }
  }, [fieldValue, fieldPath, onValueChange]);

  const handleRepeatableChange = useCallback((index: number, value: any) => {
    if (Array.isArray(fieldValue)) {
      const newItems = [...fieldValue];
      newItems[index] = value;
      onValueChange(fieldPath, newItems);
    }
  }, [fieldValue, fieldPath, onValueChange]);

  // Render display mode (non-editing)
  if (!isEditing) {
    if (isRepeatable && Array.isArray(fieldValue) && fieldValue.length > 0) {
      return (
        <div className="space-y-2">
          <div className={getImportanceLabelClasses(item.importance)}>
            {getLabel(item, registry)}
            {item.required && <span className="text-accent ml-1">*</span>}
          </div>
          {fieldValue.map((value: any, index: number) => (
            <div key={index} className={getImportanceValueClasses(item.importance)}>
              <ValueDisplay value={value} registry={registry} importance={item.importance} />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <div className={getImportanceLabelClasses(item.importance)}>
          {getLabel(item, registry)}
          {item.required && <span className={`ml-1 ${getAccentClasses().color}`}>*</span>}
        </div>
        <div className={getImportanceValueClasses(item.importance)}>
          <ValueDisplay value={fieldValue} registry={registry} importance={item.importance} />
        </div>
      </div>
    );
  }

  // Render editing mode - repeatable fields
  if (isRepeatable) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className={getImportanceLabelClasses(item.importance)}>
            {getLabel(item, registry)}
            {item.required && <span className={`ml-1 ${getAccentClasses().color}`}>*</span>}
          </div>
          {canAdd && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleRepeatableAdd}
              className="h-6 w-6 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {repeatableValues.length === 0 ? (
          <div className="text-muted-foreground text-sm">No items yet. Click + to add one.</div>
        ) : (
          <div className="space-y-2">
            {repeatableValues.map((value: any, index: number) => {
              const uniqueFieldPath = generateFieldPath(ancestorPath, item.ref, item.item_instance_id, index);
              return (
                <div key={`${fieldPath}-${index}`} className="flex items-center gap-2">
                  <div className="flex-1">
                    <DynamicFieldRenderer
                      field={registry}
                      value={value}
                      onChange={(newValue) => handleRepeatableChange(index, newValue)}
                      formValues={formValues}
                      disabled={item.editable === false}
                      inputId={`input-${uniqueFieldPath}`}
                    />
                  </div>
                  {canRemove && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleRepeatableRemove(index)}
                      className={`h-6 w-6 p-0 ${getAccentClasses().color} hover:${getAccentClasses().color}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {fieldError && (
          <div className={`text-sm ${getAccentClasses().color}`}>{fieldError}</div>
        )}
      </div>
    );
  }

  // Render editing mode - single field
  return (
    <div className="space-y-1">
      <DynamicFieldRenderer
        field={registry}
        value={fieldValue}
        onChange={(value) => onValueChange(fieldPath, value)}
        formValues={formValues}
        disabled={item.editable === false}
        inputId={`input-${fieldPath}`}
      />
      {fieldError && (
        <div className={`text-sm ${getAccentClasses().color}`}>{fieldError}</div>
      )}
    </div>
  );
};