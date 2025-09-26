// src/components/renderers/FieldRenderer.tsx
/**
 * FieldRenderer — stable hooks order (single-return)
 * - SSOT addressing (incl. nested sections & instances)
 * - reads via useHybridValue
 * - drafts via DraftsContext
 * - idle: key:value, edit: widgets
 */
import React, { useCallback, useMemo, useState } from 'react';
import { useHybridValue } from '@/lib/ltree/hooks';
import { useFieldRegistry } from '@/hooks/useFieldRegistry';
import { useDrafts } from '@/contexts/DraftsContext';
import type { JobNode } from '@/hooks/useJobs';

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

const DBG = true;
const dlog = (...a:any[]) => { if (DBG) console.debug('[RENDER:Field]', ...a); };

// Build SSOT address for nested section paths (e.g. "characters.lead").
// If instanceNum is provided, insert ".instances.iN" right after the FIRST section.
// Universal SSOT address builder (top-level, simple section, nested sections, with/without instances)
function buildFieldAddress(
  nodeAddr: string,
  fieldRef: string,
  sectionPath?: string,
  instanceNum?: number
) {
  const segs = (sectionPath || '').split('.').filter(Boolean);
  let json = 'content.items';

  if (segs.length === 0) {
    // top-level field
    json += `.${fieldRef}.value`;
  } else {
    // first section + optional instances
    json += `.${segs[0]}`;
    if (typeof instanceNum === 'number') {
      json += `.instances.i${instanceNum}`;
    }
    // deeper nested sections
    for (let i = 1; i < segs.length; i++) {
      json += `.children.${segs[i]}`;
    }
    // target field
    json += `.children.${fieldRef}.value`;
  }
  return `${nodeAddr}#${json}`;
}


type Mode = 'idle' | 'edit';

interface FieldRendererProps {
  node: JobNode;
  fieldRef: string;
  sectionPath?: string;
  instanceNum?: number;
  onChange?: (value: any) => void;
  mode?: Mode;
  required?: boolean;
  editable?: boolean;
}

export function FieldRenderer({
  node,
  fieldRef,
  sectionPath,
  instanceNum,
  onChange,
  mode = 'idle',
  required = false,
  editable = true
}: FieldRendererProps) {
  // ---- LOG INPUTS
  dlog('render', { node: node.addr, fieldRef, sectionPath, instanceNum, mode, editable, required });

  // ---- HOOKS (ALWAYS, NO EARLY RETURNS BEFORE THIS FUNCTION ENDS)
  const { getField, loading: registryLoading, error: registryError } = useFieldRegistry();
  const { get: getDraft, set: setDraft } = useDrafts();

  const address = useMemo(() => {
  try {
    const addr = buildFieldAddress(node.addr, String(fieldRef), sectionPath, instanceNum);
    dlog('address (universal)', { addr, nodeAddr: node.addr, fieldRef, sectionPath, instanceNum });
    return addr;
  } catch (e) {
    console.error('[RENDER:Field] address build error', e, { node: node.addr, sectionPath, instanceNum, fieldRef });
    return null;
  }
}, [node.addr, fieldRef, sectionPath, instanceNum]);


  // Always call the value hook (pass null to no-op) — keeps hook order stable
  const { value: dbValue, loading: valueLoading, error: valueError } =
    useHybridValue(node.job_id, address ?? null);

  const [internalError, setInternalError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const fieldDefinition = getField(fieldRef);
  const draftValue = getDraft(address || '');
  const effectiveValue = useMemo(() => {
    return draftValue !== undefined ? draftValue :
           (dbValue !== undefined ? dbValue : fieldDefinition?.default_value ?? null);
  }, [draftValue, dbValue, fieldDefinition?.default_value]);

  dlog('values', { dbValue, draftValue, effectiveValue });

  const setValue = (newValue: any) => {
    if (!address) return; // can't write if no address — but KEEP HOOK ORDER
    dlog('onChange→draft', { address, newValue });
    setDraft(address, newValue);
    onChange?.(newValue);
  };

  const validateValue = useCallback((val: any) => {
    if (!fieldDefinition) return true; // keep stable
    const rules = fieldDefinition.rules || {};
    const label = fieldDefinition.ui?.label?.fallback || fieldDefinition.ui?.label?.key || fieldDefinition.id;

    let msg: string | null = null;
    if (rules.required && (!val || (typeof val === 'string' && val.trim() === ''))) {
      msg = `${label} is required`;
    }
    if (val && typeof val === 'string') {
      if (rules.minLength && val.length < rules.minLength) msg = `${label} must be at least ${rules.minLength} characters`;
      if (rules.maxLength && val.length > rules.maxLength) msg = `${label} must be no more than ${rules.maxLength} characters`;
      if (rules.pattern && !new RegExp(rules.pattern).test(val)) msg = `${label} format is invalid`;
      setCharCount(val.length);
    }
    if (Array.isArray(val)) {
      if (rules.minItems && val.length < rules.minItems) msg = `${label} must have at least ${rules.minItems} items`;
      if (rules.maxItems && val.length > rules.maxItems) msg = `${label} must have no more than ${rules.maxItems} items`;
    }
    if (typeof val === 'number') {
      if (rules.min && val < rules.min) msg = `${label} must be at least ${rules.min}`;
      if (rules.max && val > rules.max) msg = `${label} must be no more than ${rules.max}`;
    }
    setInternalError(msg);
    return !msg;
  }, [fieldDefinition]);

  const handleChange = useCallback((val: any) => {
    setValue(val);
    validateValue(val);
  }, [setValue, validateValue]);

  // ---- STATUS/ERRORS (no early return until the bottom)
  const addressError = !address ? `Failed to build address for ${fieldRef}` : null;

  const rules = fieldDefinition?.rules || {};
  const label =
    fieldDefinition?.ui?.label?.fallback ||
    fieldDefinition?.ui?.label?.key ||
    fieldDefinition?.id ||
    fieldRef;
  const placeholder =
    fieldDefinition?.ui?.placeholder?.fallback ||
    fieldDefinition?.ui?.placeholder?.key ||
    '';
  const help =
    fieldDefinition?.ui?.help?.fallback ||
    fieldDefinition?.ui?.help?.key ||
    '';

  const isReadOnly = mode === 'idle' || !editable;
  const widget = fieldDefinition?.widget;

  // ---- CONTENT builder (single-return pattern)
  let content: React.ReactNode = null;

  if (registryLoading || (valueLoading && dbValue === null)) {
    content = <div className="h-10 bg-muted rounded animate-pulse" />;
  } else if (registryError) {
    content = (
      <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
        Field Registry Error: {String(registryError)}
        <div className="text-xs mt-1">Field: {fieldRef}</div>
      </div>
    );
  } else if (addressError) {
    content = (
      <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
        {addressError}
      </div>
    );
  } else if (!fieldDefinition) {
    content = (
      <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
        Field definition not found: {fieldRef}
        <div className="text-xs mt-1">Address: {address}</div>
      </div>
    );
  } else if (valueError) {
    content = (
      <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
        Error loading field {fieldRef}: {String(valueError)}
        <div className="text-xs mt-1">Address: {address}</div>
      </div>
    );
  } else if (isReadOnly) {
    // IDLE — show compact key:value
    let displayValue: any = effectiveValue;
    if (displayValue == null) displayValue = fieldDefinition?.default_value || '';
    if (typeof displayValue === 'boolean') displayValue = displayValue ? 'Yes' : 'No';
    else if (Array.isArray(displayValue)) displayValue = displayValue.join(', ');
    else if (typeof displayValue === 'object') displayValue = JSON.stringify(displayValue);

    content = (
      <div className="flex justify-between items-center py-2 border-b border-border/30 last:border-b-0">
        <span className="text-sm font-medium text-foreground">{label}:</span>
        <span className="text-sm text-muted-foreground">
          {displayValue || <span className="italic">No value</span>}
        </span>
      </div>
    );
  } else {
    // EDIT — widgets
    const currentValue = effectiveValue ?? fieldDefinition.default_value;

    const renderEdit = () => {
      switch (widget) {
        case 'text':
          return (
            <div className="space-y-1">
              <Input
                value={currentValue || ''}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={placeholder}
                className={cn(internalError && "border-destructive")}
              />
              {(rules.maxLength || rules.minLength) && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {rules.minLength && `Min: ${rules.minLength}`}
                    {rules.minLength && rules.maxLength && ' • '}
                    {rules.maxLength && `Max: ${rules.maxLength}`}
                  </span>
                  {rules.maxLength && (
                    <span className={cn(
                      charCount > rules.maxLength ? "text-destructive" : "",
                      charCount > (rules.maxLength * 0.9) ? "text-warning" : ""
                    )}>
                      {charCount}/{rules.maxLength}
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
                className={cn(internalError && "border-destructive")}
                rows={4}
              />
              {rules.maxLength && (
                <div className="flex justify-end text-xs text-muted-foreground">
                  <span className={cn(
                    charCount > rules.maxLength ? "text-destructive" : "",
                    charCount > rules.maxLength * 0.9 ? "text-warning" : ""
                  )}>
                    {charCount}/{rules.maxLength}
                  </span>
                </div>
              )}
            </div>
          );

        case 'select': {
          const options = fieldDefinition.options?.values || [];
          return (
            <Select value={currentValue || ''} onValueChange={handleChange}>
              <SelectTrigger className={cn(internalError && "border-destructive")}>
                <SelectValue placeholder={placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt: any, i: number) => (
                  <SelectItem key={opt.value || i} value={opt.value}>
                    {opt.label?.fallback || opt.label || opt.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        case 'radio': {
          const options = fieldDefinition.options?.values || [];
          return (
            <RadioGroup
              value={currentValue || ''}
              onValueChange={handleChange}
              className={cn(internalError && "border border-destructive rounded-md p-2")}
            >
              {options.map((opt: any, i: number) => (
                <div key={opt.value || i} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`${fieldDefinition.id}-${i}`} />
                  <Label htmlFor={`${fieldDefinition.id}-${i}`}>
                    {opt.label?.fallback || opt.label || opt.value}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          );
        }

        case 'checkbox':
          return (
            <div className={cn("flex items-center space-x-2", internalError && "text-destructive")}>
              <Checkbox
                checked={currentValue || false}
                onCheckedChange={handleChange}
                id={fieldDefinition.id}
              />
              <Label htmlFor={fieldDefinition.id}>{label}</Label>
            </div>
          );

        case 'tags': {
          const values = fieldDefinition.options?.values || [];
          const selected = Array.isArray(currentValue) ? currentValue : [];
          const toggleTag = (tag: string) => {
            const next = selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag];
            handleChange(next);
          };
          return (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
                {selected.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <Button variant="ghost" size="sm" className="h-auto p-0 w-4 h-4" onClick={() => toggleTag(tag)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {selected.length === 0 && (
                  <span className="text-muted-foreground text-sm">{placeholder || 'Select tags'}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {values.filter((o: any) => !selected.includes(o.value)).map((o: any, i: number) => (
                  <Button key={o.value || i} variant="outline" size="sm" onClick={() => toggleTag(o.value)} className="h-7">
                    <Plus className="h-3 w-3 mr-1" />
                    {o.label?.fallback || o.label || o.value}
                  </Button>
                ))}
              </div>
              {rules?.minItems && selected.length < rules.minItems && (
                <p className="text-xs text-muted-foreground">Select at least {rules.minItems} items</p>
              )}
              {rules?.maxItems && (
                <p className="text-xs text-muted-foreground">
                  {selected.length}/{rules.maxItems} selected
                </p>
              )}
            </div>
          );
        }

        case 'date':
          return (
            <Input type="date" value={currentValue || ''} onChange={(e) => handleChange(e.target.value)} className={cn(internalError && "border-destructive")} />
          );

        case 'time':
          return (
            <Input type="time" value={currentValue || ''} onChange={(e) => handleChange(e.target.value)} className={cn(internalError && "border-destructive")} />
          );

        case 'email':
          return (
            <Input type="email" value={currentValue || ''} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder} className={cn(internalError && "border-destructive")} />
          );

        case 'url':
          return (
            <Input type="url" value={currentValue || ''} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder} className={cn(internalError && "border-destructive")} />
          );

        case 'number':
          return (
            <Input type="number" value={currentValue || ''} onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : '')} placeholder={placeholder} min={rules?.min} max={rules?.max} className={cn(internalError && "border-destructive")} />
          );

        case 'file':
          return (
            <Input type="file" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleChange({ name: file.name, size: file.size, type: file.type });
            }} className={cn(internalError && "border-destructive")} />
          );

        default:
          return (
            <div className="p-4 border border-dashed rounded-md">
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Unsupported widget type: {String(widget)}
              </p>
            </div>
          );
      }
    };

    content = (
      <div className="space-y-2">
        {fieldDefinition.widget !== 'checkbox' && (
          <Label htmlFor={fieldDefinition.id} className="flex items-center gap-1">
            {label}
            {required && <span className="text-destructive">*</span>}
            {help && <span className="text-xs text-muted-foreground ml-2">({help})</span>}
          </Label>
        )}
        {renderEdit()}
        {internalError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {internalError}
          </p>
        )}
      </div>
    );
  }

  // ---- SINGLE RETURN
  return <>{content}</>;
}

export default FieldRenderer;
