import { useState, useCallback, useEffect, useRef } from 'react';
import { useLtreeResolver } from './useLtreeResolver';
import { createLtreeAddresses } from '@/lib/ltree/addresses';
import { useFields, type FieldEntry } from './useFields';
import type { JobNode } from './useJobs';

interface FieldState {
  value: any;
  loading: boolean;
  error?: string;
  isDirty: boolean;
  lastSaved?: Date;
}

interface UseNodeFieldManagerProps {
  node: JobNode;
  onUpdate?: (nodeId: string, content: any) => Promise<void>;
}

export function useNodeFieldManager({ node, onUpdate }: UseNodeFieldManagerProps) {
  const { getEntry } = useFields();
  const { resolveValue, setValue } = useLtreeResolver();
  
  // Field states - keyed by fieldRef for isolation
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const [fieldEntries, setFieldEntries] = useState<Record<string, FieldEntry | null>>({});
  
  // Debounced auto-save
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Set<string>>(new Set());
  
  // Ltree address builder for this node
  const addresses = createLtreeAddresses(node.job_id, node.path);
  
  // Collect field refs from node content
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

  // Initialize field data
  useEffect(() => {
    const initializeFields = async () => {
      const fieldRefs = collectFieldRefs(node.content?.items || []);
      const newFieldStates: Record<string, FieldState> = {};
      const newFieldEntries: Record<string, FieldEntry | null> = {};
      
      console.log(`[FIELD MANAGER] Initializing ${fieldRefs.length} fields for node:`, node.path);
      
      for (const fieldRef of fieldRefs) {
        try {
          // Load field entry from registry
          const fieldEntry = await getEntry(fieldRef);
          newFieldEntries[fieldRef] = fieldEntry;
          
          // Load current value via ltree with proper address isolation
          const address = addresses.fieldValue(fieldRef);
          console.log(`[FIELD MANAGER] Loading ${fieldRef} from ${address}`);
          
          const currentValue = await resolveValue(node.job_id, address);
          
          newFieldStates[fieldRef] = {
            value: currentValue,
            loading: false,
            isDirty: false,
            error: undefined
          };
          
          console.log(`[FIELD MANAGER] Loaded ${fieldRef}:`, currentValue);
          
        } catch (error) {
          console.error(`[FIELD MANAGER] Failed to initialize field ${fieldRef}:`, error);
          newFieldEntries[fieldRef] = null;
          newFieldStates[fieldRef] = {
            value: undefined,
            loading: false,
            isDirty: false,
            error: error instanceof Error ? error.message : 'Failed to load field'
          };
        }
      }
      
      setFieldEntries(newFieldEntries);
      setFieldStates(newFieldStates);
    };
    
    initializeFields();
  }, [node.content?.items, node.job_id, node.path, getEntry, addresses, resolveValue, collectFieldRefs]);

  // Get field value with proper isolation
  const getFieldValue = useCallback((fieldRef: string): any => {
    const state = fieldStates[fieldRef];
    console.log(`[FIELD MANAGER] Getting value for ${fieldRef}:`, state?.value);
    return state?.value;
  }, [fieldStates]);

  // Set field value with proper isolation and debounced auto-save
  const setFieldValue = useCallback(async (fieldRef: string, value: any) => {
    const address = addresses.fieldValue(fieldRef);
    console.log(`[FIELD MANAGER] Setting ${fieldRef} to:`, value, 'Address:', address);
    
    // Update local state immediately (optimistic update)
    setFieldStates(prev => ({
      ...prev,
      [fieldRef]: {
        ...prev[fieldRef],
        value,
        isDirty: true,
        loading: true,
        error: undefined
      }
    }));
    
    try {
      // Save to ltree backend
      await setValue(node.job_id, address, value);
      
      // Mark as successfully saved
      setFieldStates(prev => ({
        ...prev,
        [fieldRef]: {
          ...prev[fieldRef],
          loading: false,
          lastSaved: new Date()
        }
      }));
      
      // Add to pending changes for batch save
      pendingChangesRef.current.add(fieldRef);
      
      // Trigger debounced auto-save to node content
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        if (onUpdate && pendingChangesRef.current.size > 0) {
          console.log(`[FIELD MANAGER] Auto-saving ${pendingChangesRef.current.size} changed fields`);
          saveToNodeContent();
        }
      }, 1000); // 1 second debounce
      
    } catch (error) {
      console.error(`[FIELD MANAGER] Failed to save field ${fieldRef}:`, error);
      setFieldStates(prev => ({
        ...prev,
        [fieldRef]: {
          ...prev[fieldRef],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to save field'
        }
      }));
    }
  }, [addresses, setValue, node.job_id, onUpdate]);

  // Save all dirty fields to node content structure
  const saveToNodeContent = useCallback(async () => {
    if (!onUpdate || pendingChangesRef.current.size === 0) return;
    
    try {
      // Create updated content with current field values
      const updatedContent = JSON.parse(JSON.stringify(node.content || {}));
      
      // Update field values in the content structure
      function updateFieldsInItems(items: any[]) {
        for (const item of items || []) {
          if (item?.kind === 'FieldItem' && item.ref) {
            const fieldState = fieldStates[item.ref];
            if (fieldState && pendingChangesRef.current.has(item.ref)) {
              item.value = fieldState.value;
              console.log(`[FIELD MANAGER] Updated content field ${item.ref}:`, fieldState.value);
            }
          }
          
          if (item?.children) updateFieldsInItems(item.children);
          if (item?.items) updateFieldsInItems(item.items);
          if (item?.instances) {
            for (const instance of item.instances) {
              if (instance?.children) updateFieldsInItems(instance.children);
            }
          }
        }
      }
      
      updateFieldsInItems(updatedContent?.items || []);
      
      // Save to database
      await onUpdate(node.id, updatedContent);
      
      // Clear dirty states
      const clearedFields = Array.from(pendingChangesRef.current);
      setFieldStates(prev => {
        const updated = { ...prev };
        for (const fieldRef of clearedFields) {
          if (updated[fieldRef]) {
            updated[fieldRef] = { 
              ...updated[fieldRef], 
              isDirty: false,
              lastSaved: new Date()
            };
          }
        }
        return updated;
      });
      
      pendingChangesRef.current.clear();
      console.log(`[FIELD MANAGER] Successfully saved ${clearedFields.length} fields to node content`);
      
    } catch (error) {
      console.error('[FIELD MANAGER] Failed to save to node content:', error);
      throw error;
    }
  }, [onUpdate, node.content, node.id, fieldStates]);

  // Manual save all changes
  const saveAllChanges = useCallback(async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    
    // Mark all dirty fields as pending
    Object.keys(fieldStates).forEach(fieldRef => {
      if (fieldStates[fieldRef]?.isDirty) {
        pendingChangesRef.current.add(fieldRef);
      }
    });
    
    return saveToNodeContent();
  }, [fieldStates, saveToNodeContent]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = Object.values(fieldStates).some(state => state?.isDirty);
  
  // Check if any fields are loading
  const isLoading = Object.values(fieldStates).some(state => state?.loading);
  
  // Get field state for UI
  const getFieldState = useCallback((fieldRef: string) => {
    return fieldStates[fieldRef] || { value: undefined, loading: false, isDirty: false };
  }, [fieldStates]);
  
  // Get field entry for UI
  const getFieldEntry = useCallback((fieldRef: string) => {
    return fieldEntries[fieldRef];
  }, [fieldEntries]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  return {
    // Field data access
    getFieldValue,
    setFieldValue,
    getFieldState,
    getFieldEntry,
    
    // Save operations
    saveAllChanges,
    
    // Status
    hasUnsavedChanges,
    isLoading,
    
    // Field refs for iteration
    fieldRefs: collectFieldRefs(node.content?.items || [])
  };
}