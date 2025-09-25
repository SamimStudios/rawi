import React from 'react';
import { useHybridValue } from '@/lib/ltree/hooks';
import SystematicFieldRenderer from './SystematicFieldRenderer';
import type { JobNode } from '@/hooks/useJobs';

interface FieldHybridRendererProps {
  /** Current job node for context */
  node: JobNode;
  /** Field reference identifier */
  fieldRef: string;
  /** Optional callback when field value changes */
  onChange?: (value: any) => void;
  /** Display mode */
  mode?: 'idle' | 'edit';
}

/**
 * Renders a field using the hybrid address system for isolated state management.
 * Each field uses the ltree address format: {node.path}#{fieldRef}.value
 */
export function FieldHybridRenderer({
  node,
  fieldRef,
  onChange,
  mode = 'idle'
}: FieldHybridRendererProps) {
  // Create proper ltree hybrid address: {node.path}#{fieldRef}.value
  const address = `${node.path}#${fieldRef}.value`;
  
  // Use hybrid address system for isolated field state
  const {
    value,
    setValue,
    loading,
    error
  } = useHybridValue(node.job_id, address);

  // Handle field value updates
  const handleValueChange = async (newValue: any) => {
    try {
      await setValue(newValue);
      onChange?.(newValue);
    } catch (err) {
      console.error(`Failed to update field ${fieldRef} at ${address}:`, err);
    }
  };

  // Show loading state while field is being fetched/saved
  if (loading && value === null) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-muted rounded"></div>
      </div>
    );
  }

  // Show error state if field failed to load/save
  if (error) {
    return (
      <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
        Error loading field {fieldRef}: {error}
        <div className="text-xs mt-1">Address: {address}</div>
      </div>
    );
  }

  return (
    <SystematicFieldRenderer
      field={{
        id: fieldRef,
        datatype: 'string', // Default datatype
        widget: 'text', // Default to text widget
        options: null, // No options by default
        ui: {
          label: { fallback: fieldRef },
          placeholder: { fallback: `Enter ${fieldRef}` }
        },
        rules: {},
        default_value: ''
      }}
      value={value || ''}
      onChange={handleValueChange}
      loading={loading}
      error={error}
    />
  );
}