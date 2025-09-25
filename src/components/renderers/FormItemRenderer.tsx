/**
 * FormItemRenderer - Renders individual form items (FieldItem, SectionItem)
 * Following SSOT Form Content Contract v2-items
 */
import React from 'react';
import { FieldHybridRenderer } from './FieldHybridRenderer';
import { SectionRenderer } from './SectionRenderer';
import { FormItem, FieldItem, SectionItem, ContentValidation } from '@/lib/content-contracts';
import type { JobNode } from '@/hooks/useJobs';

interface FormItemRendererProps {
  /** The form item to render */
  item: FormItem;
  /** Current job node for context */
  node: JobNode;
  /** Parent section path (for nested addressing) */
  parentPath?: string;
  /** Instance number for collection items */
  instanceNum?: number;
  /** Display mode */
  mode?: 'idle' | 'edit';
  /** Callback when item value changes */
  onChange?: (itemRef: string, value: any) => void;
}

/**
 * Renders form items according to SSOT specification
 */
export function FormItemRenderer({
  item,
  node,
  parentPath,
  instanceNum,
  mode = 'idle',
  onChange
}: FormItemRendererProps) {
  console.log(`[FormItemRenderer] Rendering item:`, item);

  if (ContentValidation.isFieldItem(item)) {
    return (
      <FieldHybridRenderer
        node={node}
        fieldRef={item.ref}
        sectionPath={parentPath}
        instanceNum={instanceNum}
        mode={mode}
        required={item.required}
        editable={item.editable !== false}
        onChange={(value) => onChange?.(item.ref, value)}
      />
    );
  }

  if (ContentValidation.isSectionItem(item)) {
    return (
      <SectionRenderer
        section={item}
        node={node}
        parentPath={parentPath}
        instanceNum={instanceNum}
        mode={mode}
        onChange={onChange}
      />
    );
  }

  // Unknown item type
  console.warn('[FormItemRenderer] Unknown form item type:', item);
  return (
    <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
      Unknown form item type: {(item as any)?.kind || 'undefined'}
    </div>
  );
}