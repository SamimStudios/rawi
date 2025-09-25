import { useState, useCallback, useEffect, useRef } from 'react';
import { useBatchedLtreeResolver } from './useBatchedLtreeResolver';
import { useFieldRegistryCache } from './useFieldRegistryCache';
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
  const fieldCache = useFieldRegistryCache();
  const batchedResolver = useBatchedLtreeResolver();
  
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

  // Initialize field data with batching
  useEffect(() => {
    const initializeFields = async () => {
      const fieldRefs = collectFieldRefs(node.content?.items || []);
      
      if (fieldRefs.length === 0) {
        console.log(`[FIELD MANAGER] No fields to initialize for node: ${node.path}`);
        return;
      }
      
      console.log(`[FIELD MANAGER] Batch initializing ${fieldRefs.length} fields for node:`, node.path);
      
      try {
        // Batch load field entries from cache
        const entries = await fieldCache.getCachedEntries(fieldRefs);
        setFieldEntries(entries);
        
        // Batch load field values from ltree
        const fieldAddresses = fieldRefs.map(ref => addresses.fieldValue(ref));
        const valuesByAddress = await batchedResolver.batchResolveMultiple(node.job_id, fieldAddresses);
        
        // Convert address-based results back to field-ref-based
        const fieldValues: Record<string, any> = {};
        const initialStates: Record<string, FieldState> = {};
        
        fieldRefs.forEach(fieldRef => {
          const address = addresses.fieldValue(fieldRef);
          const value = valuesByAddress[address];
          
          fieldValues[fieldRef] = value;
          initialStates[fieldRef] = {
            value,
            loading: false,
            isDirty: false,
            error: undefined
          };
          
          console.log(`[FIELD MANAGER] Initialized ${fieldRef} with value:`, value);
        });
        
        setFieldStates(initialStates);
        
      } catch (error) {
        console.error(`[FIELD MANAGER] Batch initialization failed:`, error);
        
        // Fallback to individual loading
        const fallbackEntries: Record<string, FieldEntry | null> = {};
        const fallbackStates: Record<string, FieldState> = {};
        
        for (const fieldRef of fieldRefs) {
          try {
            const entry = await fieldCache.getCachedEntry(fieldRef);
            fallbackEntries[fieldRef] = entry;
            
            const address = addresses.fieldValue(fieldRef);
            const value = await batchedResolver.batchResolveValue(node.job_id, address);
            
            fallbackStates[fieldRef] = {
              value,
              loading: false,
              isDirty: false,
              error: undefined
            };
          } catch (fieldError) {
            console.error(`[FIELD MANAGER] Failed to load field ${fieldRef}:`, fieldError);
            fallbackEntries[fieldRef] = null;
            fallbackStates[fieldRef] = {
              value: undefined,
              loading: false,
              isDirty: false,
              error: fieldError instanceof Error ? fieldError.message : 'Failed to load field'
            };
          }
        }
        
        setFieldEntries(fallbackEntries);
        setFieldStates(fallbackStates);
      }
    };
    
    initializeFields();
  }, [node.content?.items, node.job_id, node.path, fieldCache, batchedResolver, collectFieldRefs]);

  // Get field value with proper isolation
  const getFieldValue = useCallback((fieldRef: string): any => {
    const state = fieldStates[fieldRef];
    console.log(`[FIELD MANAGER] Getting value for ${fieldRef}:`, state?.value);
    return state?.value;
  }, [fieldStates]);

  // Set field value with batching and optimistic updates
  const setFieldValue = useCallback(async (fieldRef: string, value: any) => {
    const address = addresses.fieldValue(fieldRef);
    console.log(`[FIELD MANAGER] Setting ${fieldRef} to:`, value, 'Address:', address);
    
    // Optimistic update - update UI immediately
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
      // Save to ltree backend using batched resolver
      await batchedResolver.batchSetValue(node.job_id, address, value);
      
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
      }, 500); // Reduced debounce for better responsiveness
      
    } catch (error) {
      console.error(`[FIELD MANAGER] Failed to save field ${fieldRef}:`, error);
      
      // Revert optimistic update on error
      setFieldStates(prev => ({
        ...prev,
        [fieldRef]: {
          ...prev[fieldRef],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to save field'
        }
      }));
    }
  }, [addresses, batchedResolver, node.job_id, onUpdate]);

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
      batchedResolver.cleanup();
    };
  }, [batchedResolver]);

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
    fieldRefs: collectFieldRefs(node.content?.items || []),
    
    // Performance debugging
    getBatchStats: () => batchedResolver.getQueueStats(),
    getCacheStats: () => fieldCache.getCacheStats()
  };
}