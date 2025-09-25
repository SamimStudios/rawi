import { useState, useCallback, useEffect, useRef } from 'react';
import { createLtreeAddresses } from '@/lib/ltree/addresses';
import { useHybridValue } from '@/lib/ltree/hooks';
import type { JobNode } from './useJobs';

// Field state interface - simplified since useHybridValue handles most of this
interface FieldState {
  value: any;
  loading: boolean;
  error: string | null;
  isDirty: boolean;
  address: string; // The hybrid address for this field
}

interface UseNodeFieldManagerProps {
  node: JobNode;
  onUpdate?: (node: JobNode) => Promise<void>;
}

/**
 * Node field manager that uses the hybrid address system for isolated field state
 * Each field gets a unique ltree address: {node.path}#content.items.{fieldRef}.value
 */
export function useNodeFieldManager({ node, onUpdate }: UseNodeFieldManagerProps) {
  // Create address builder for this node
  const addressBuilder = createLtreeAddresses(node.job_id, node.path);
  
  // Field tracking state
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const [fieldRefs, setFieldRefs] = useState<string[]>([]);

  // Auto-save debouncing
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const AUTOSAVE_DELAY_MS = 2000;

  /**
   * Recursively collect field references from node content items
   */
  const collectFieldRefs = useCallback((items: any[]): string[] => {
    const refs: string[] = [];
    
    function traverse(items: any[]) {
      for (const item of items || []) {
        if (item?.kind === 'FieldItem' && item.ref) {
          refs.push(item.ref);
        }
        if (item?.children) traverse(item.children);
        if (item?.items) traverse(item.items);
        if (item?.instances) {
          for (const instance of item.instances) {
            if (instance?.children) traverse(instance.children);
          }
        }
      }
    }
    
    traverse(items);
    return Array.from(new Set(refs));
  }, []);

  /**
   * Initialize field states from node content
   */
  useEffect(() => {
    if (!node?.content?.items || !Array.isArray(node.content.items)) {
      setFieldStates({});
      setFieldRefs([]);
      return;
    }

    // Collect all field references from the node content recursively
    const refs = collectFieldRefs(node.content.items);
    setFieldRefs(refs);

    console.log(`[FieldManager] Collected ${refs.length} field refs:`, refs);

    // Initialize field states with hybrid addresses
    const initialStates: Record<string, FieldState> = {};
    
    refs.forEach(fieldRef => {
      const address = addressBuilder.fieldValue(fieldRef);
      initialStates[fieldRef] = {
        value: null,
        loading: false, // useHybridValue will handle loading
        error: null,
        isDirty: false,
        address
      };
    });

    setFieldStates(initialStates);
  }, [node.content, addressBuilder]);

  /**
   * Get the current value of a field
   */
  const getFieldValue = useCallback((fieldRef: string): any => {
    return fieldStates[fieldRef]?.value || '';
  }, [fieldStates]);

  /**
   * Update a field value - will be handled by individual useHybridValue hooks
   * This is now just a stub that updates local state for UI consistency
   */
  const setFieldValue = useCallback(async (fieldRef: string, value: any): Promise<void> => {
    console.log(`[FieldManager] Local state update for field ${fieldRef}:`, value);

    // Update local state for immediate UI feedback
    setFieldStates(prev => ({
      ...prev,
      [fieldRef]: {
        ...prev[fieldRef],
        value,
        isDirty: true
      }
    }));

    // Trigger debounced auto-save to node content
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveToNodeContent();
    }, AUTOSAVE_DELAY_MS);
  }, []);

  /**
   * Update field in content structure recursively
   */
  const updateFieldInContent = useCallback((content: any, fieldRef: string, value: any) => {
    function updateInItems(items: any[]) {
      for (const item of items || []) {
        if (item?.kind === 'FieldItem' && item.ref === fieldRef) {
          item.value = value;
        }
        if (item?.children) updateInItems(item.children);
        if (item?.items) updateInItems(item.items);
        if (item?.instances) {
          for (const instance of item.instances) {
            if (instance?.children) updateInItems(instance.children);
          }
        }
      }
    }
    
    updateInItems(content?.items || []);
  }, []);

  /**
   * Save all field changes to the node's content structure
   */
  const saveToNodeContent = useCallback(async (): Promise<void> => {
    if (!onUpdate) return;

    console.log('[FieldManager] Saving to node content...');

    try {
      // Create updated content with all field values
      const updatedContent = { ...node.content };
      
      // Update each field in the content structure
      fieldRefs.forEach(fieldRef => {
        const fieldState = fieldStates[fieldRef];
        if (fieldState?.isDirty) {
          // Navigate to the field in the content structure and update its value
          updateFieldInContent(updatedContent, fieldRef, fieldState.value);
        }
      });

      // Update the node with new content
      const updatedNode = { ...node, content: updatedContent };
      await onUpdate(updatedNode);

      // Mark all fields as clean
      setFieldStates(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(fieldRef => {
          if (updated[fieldRef].isDirty) {
            updated[fieldRef] = {
              ...updated[fieldRef],
              isDirty: false
            };
          }
        });
        return updated;
      });

      console.log('[FieldManager] Successfully saved to node content');
    } catch (error) {
      console.error('[FieldManager] Failed to save to node content:', error);
    }
  }, [node, onUpdate, fieldRefs, fieldStates, updateFieldInContent]);

  /**
   * Manually save all pending changes
   */
  const saveAllChanges = useCallback(async (): Promise<void> => {
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

    await saveToNodeContent();
  }, [saveToNodeContent]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Return the field manager interface
  return {
    // Field value access
    getFieldValue,
    setFieldValue,
    
    // Bulk operations
    saveAllChanges,
    
    // State queries
    hasUnsavedChanges: Object.values(fieldStates).some(state => state.isDirty),
    isLoading: Object.values(fieldStates).some(state => state.loading),
    
    // Field metadata access  
    getFieldState: (fieldRef: string) => fieldStates[fieldRef],
    
    // Field enumeration
    fieldRefs,
    
    // Address access for debugging
    getFieldAddress: (fieldRef: string) => fieldStates[fieldRef]?.address
  };
}