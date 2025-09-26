/**
 * FieldHybridRenderer - SSOT compliant field renderer with registry integration
 * 
 * This component acts as a data connector that:
 * 1. Uses proper node.addr addressing (not node.path)
 * 2. Fetches field definitions from app.field_registry
 * 3. Delegates UI rendering to SystematicFieldRenderer
 * 4. Integrates with DraftsProvider for local-only changes until Save
 * 
 * Architecture:
 * - FieldHybridRenderer: Data connector using hybrid addresses (this file)
 * - SystematicFieldRenderer: Final UI renderer
 */
import React from 'react';
import { useHybridValue } from '@/lib/ltree/hooks';
import { useFieldRegistry } from '@/hooks/useFieldRegistry';
import { FormAddr } from '@/lib/ltree/addresses';
import { useDrafts } from '@/contexts/DraftsContext';
import SystematicFieldRenderer from './SystematicFieldRenderer';
import type { JobNode } from '@/hooks/useJobs';

const DBG = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_RENDER === '1';
const dlog = (...a:any[]) => { if (DBG) console.debug('[RENDER:Field]', ...a); };



interface FieldHybridRendererProps {
  /** Current job node for context */
  node: JobNode;
  /** Field reference identifier */
  fieldRef: string;
  /** Optional section path for nested fields */
  sectionPath?: string;
  /** Optional instance number for collection fields */
  instanceNum?: number;
  /** Optional callback when field value changes */
  onChange?: (value: any) => void;
  /** Display mode */
  mode?: 'idle' | 'edit';
  /** Whether field is required */
  required?: boolean;
  /** Whether field is editable */
  editable?: boolean;
}

/**
 * SSOT-compliant field renderer using proper addressing and field registry
 */
export function FieldHybridRenderer({
  node,
  fieldRef,
  sectionPath,
  instanceNum,
  onChange,
  mode = 'idle',
  required = false,
  editable = true
}: FieldHybridRendererProps) {
  dlog('render', { node: node.addr, fieldRef, sectionPath, instanceNum, mode, editable, required });

  const { getField, loading: registryLoading, error: registryError } = useFieldRegistry();
  const { get: getDraft, set: setDraft } = useDrafts();

  // Create proper SSOT hybrid address using node.addr
const address = React.useMemo(() => {
  try {
    if (sectionPath) {
      // section field (single or instance)
      const addr = (typeof instanceNum === 'number')
        ? FormAddr.sectionInstanceFieldValue(node.addr, sectionPath, instanceNum, fieldRef)
        : FormAddr.sectionFieldValue(node.addr, sectionPath, fieldRef);
      dlog('address (section)', { node: node.addr, sectionPath, instanceNum, fieldRef, addr });
      return addr;
    }

    // top-level field (single or instance)
    const addr = (typeof instanceNum === 'number')
      ? FormAddr.fieldInstanceValue(node.addr, fieldRef, instanceNum)
      : FormAddr.fieldValue(node.addr, fieldRef);
    dlog('address (field)', { node: node.addr, instanceNum, fieldRef, addr });
    return addr;
  } catch (e) {
    console.error('[RENDER:Field] address build error', e, { node: node.addr, sectionPath, instanceNum, fieldRef });
    return null;
  }
}, [node.addr, fieldRef, sectionPath, instanceNum]);

  if (!address) {
  return (
    <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
      Failed to build address for {fieldRef}
    </div>
  );
}



dlog('address:using', address);

  // Use hybrid address system for DB field state (READ ONLY during edit)
  const {
    value: dbValue,
    loading: valueLoading,
    error: valueError
  } = useHybridValue(node.job_id, address);

  // Get field definition from registry
  const fieldDefinition = getField(fieldRef);

  // Get effective value: draft ?? db ?? default
  const draftValue = getDraft(address);
  const effectiveValue = React.useMemo(() => {
    return draftValue !== undefined ? draftValue : 
           (dbValue !== undefined ? dbValue : 
            fieldDefinition?.default_value);
  }, [draftValue, dbValue, fieldDefinition?.default_value]);

  console.log(`[FieldHybridRenderer] Values - DB: ${dbValue}, Draft: ${draftValue}, Effective: ${effectiveValue}`);

  // Handle field value updates - ONLY update drafts, never persist to DB
const handleValueChange = (newValue: any) => {
  dlog('onChange→draft', { address, newValue });
  setDraft(address, newValue);
  onChange?.(newValue);
};


  // Show loading state while fetching registry or field value
  if (registryLoading || (valueLoading && dbValue === null)) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-muted rounded"></div>
      </div>
    );
  }

  // Show registry error
  if (registryError) {
    return (
      <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
        Field Registry Error: {registryError}
        <div className="text-xs mt-1">Field: {fieldRef}</div>
      </div>
    );
  }

  // Show field not found error
  if (!fieldDefinition) {
    return (
      <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
        Field definition not found: {fieldRef}
        <div className="text-xs mt-1">Address: {address}</div>
      </div>
    );
  }

  // Show value error
  if (valueError) {
    return (
      <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
        Error loading field {fieldRef}: {valueError}
        <div className="text-xs mt-1">Address: {address}</div>
      </div>
    );
  }

  // In idle mode, show key and value in read-only format
  if (mode === 'idle') {
    const label = fieldDefinition?.ui?.label?.fallback || fieldRef;
    let displayValue = effectiveValue;
    
    // Format different types for display
    if (displayValue == null) {
    displayValue = fieldDefinition?.default_value || '';
 }
    
    if (typeof displayValue === 'boolean') {
      displayValue = displayValue ? 'Yes' : 'No';
    } else if (Array.isArray(displayValue)) {
      displayValue = displayValue.join(', ');
    } else if (typeof displayValue === 'object') {
      displayValue = JSON.stringify(displayValue);
    }
    
    return (
      <div className="flex justify-between items-center py-2 border-b border-border/30 last:border-b-0">
        <span className="text-sm font-medium text-foreground">{label}:</span>
        <span className="text-sm text-muted-foreground">
          {displayValue || <span className="italic">No value</span>}
        </span>
      </div>
    );
  }

  // In edit mode, render interactive field
  return (
    <SystematicFieldRenderer
      field={{
        id: fieldDefinition.id,
        datatype: fieldDefinition.datatype,
        widget: fieldDefinition.widget,
        options: fieldDefinition.options || null,
        ui: fieldDefinition.ui || {},
        rules: fieldDefinition.rules || {},
        default_value: fieldDefinition.default_value || ''
      }}
      value={effectiveValue ?? ''}
      onChange={handleValueChange}
      loading={valueLoading}
      error={valueError}
      mode={!editable ? 'idle' : mode}
    />
  );
}
