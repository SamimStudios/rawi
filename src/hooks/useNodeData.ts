/**
 * Enhanced node data management using ltree system
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { HybridAddrService } from '@/lib/ltree/service';
import { createLtreeAddresses } from '@/lib/ltree/addresses';
import { useHybridValue } from '@/lib/ltree/hooks';
import type { JobNode } from '@/hooks/useJobs';

export interface UseNodeDataOptions {
  node: JobNode;
  onUpdate?: (nodeId: string, content: any) => Promise<void>;
  autoSave?: boolean;
  debounceMs?: number;
}

export interface UseNodeDataReturn {
  // Data access
  nodeContent: any;
  getFieldValue: (fieldRef: string) => any;
  setFieldValue: (fieldRef: string, value: any) => Promise<void>;
  
  // Bulk operations
  updateContent: (content: any) => Promise<void>;
  refreshContent: () => Promise<void>;
  
  // State tracking
  hasUnsavedChanges: boolean;
  isAutoSaving: boolean;
  lastSaved: Date | null;
  
  // Field-level state
  fieldErrors: Record<string, string>;
  fieldStates: Record<string, { loading: boolean; error: string | null }>;
  
  // Actions
  saveChanges: () => Promise<void>;
  discardChanges: () => void;
  
  // Validation
  validateField: (fieldRef: string) => Promise<boolean>;
  validateAllFields: () => Promise<boolean>;
  
  // Address utilities
  addresses: ReturnType<typeof createLtreeAddresses>;
}

export function useNodeData({
  node,
  onUpdate,
  autoSave = true,
  debounceMs = 300
}: UseNodeDataOptions): UseNodeDataReturn {
  const { toast } = useToast();
  const addresses = createLtreeAddresses(node.job_id, node.path);
  
  // Use ltree hooks for content management
  const {
    value: nodeContent,
    setValue: setNodeContent,
    refresh: refreshContent,
    loading: contentLoading,
    error: contentError
  } = useHybridValue(node.job_id, addresses.nodeContent());

  // Local state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldStates, setFieldStates] = useState<Record<string, { loading: boolean; error: string | null }>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Refs for debouncing
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastContentRef = useRef(nodeContent);

  /**
   * Get a field value from the node content
   */
  const getFieldValue = useCallback((fieldRef: string): any => {
    if (!nodeContent?.items) return undefined;
    
    const findFieldValue = (items: any[]): any => {
      for (const item of items) {
        if (item.kind === 'FieldItem' && item.ref === fieldRef) {
          return item.value;
        }
        // Recursively search in sections and collections
        if (item.children && Array.isArray(item.children)) {
          const childValue = findFieldValue(item.children);
          if (childValue !== undefined) return childValue;
        }
        if (item.instances && Array.isArray(item.instances)) {
          for (const instance of item.instances) {
            if (instance.children && Array.isArray(instance.children)) {
              const instanceValue = findFieldValue(instance.children);
              if (instanceValue !== undefined) return instanceValue;
            }
          }
        }
      }
      return undefined;
    };
    
    return findFieldValue(nodeContent.items);
  }, [nodeContent]);

  /**
   * Set a field value using ltree addresses
   */
  const setFieldValue = useCallback(async (fieldRef: string, value: any): Promise<void> => {
    try {
      // Set field loading state
      setFieldStates(prev => ({
        ...prev,
        [fieldRef]: { loading: true, error: null }
      }));

      // Use direct ltree address for the field
      const fieldAddress = addresses.fieldValue(fieldRef);
      await HybridAddrService.setItemAt({
        jobId: node.job_id,
        address: fieldAddress,
        value
      });

      // Update local content for immediate UI feedback
      setNodeContent(prev => {
        if (!prev?.items) return prev;
        
        const updateFieldInItems = (items: any[]): any[] => {
          return items.map(item => {
            if (item.kind === 'FieldItem' && item.ref === fieldRef) {
              return { ...item, value };
            }
            // Handle nested structures
            if (item.children && Array.isArray(item.children)) {
              return { ...item, children: updateFieldInItems(item.children) };
            }
            if (item.instances && Array.isArray(item.instances)) {
              return {
                ...item,
                instances: item.instances.map((instance: any) => ({
                  ...instance,
                  children: instance.children ? updateFieldInItems(instance.children) : instance.children
                }))
              };
            }
            return item;
          });
        };

        return {
          ...prev,
          items: updateFieldInItems(prev.items)
        };
      });

      // Clear field error
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[fieldRef];
        return updated;
      });

      // Mark as having changes
      setHasUnsavedChanges(true);
      
      // Auto-save if enabled
      if (autoSave && onUpdate) {
        scheduleAutoSave();
      }

      // Success state
      setFieldStates(prev => ({
        ...prev,
        [fieldRef]: { loading: false, error: null }
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update field';
      
      setFieldErrors(prev => ({
        ...prev,
        [fieldRef]: errorMessage
      }));
      
      setFieldStates(prev => ({
        ...prev,
        [fieldRef]: { loading: false, error: errorMessage }
      }));

      toast({
        title: "Field Update Failed",
        description: `Failed to update ${fieldRef}: ${errorMessage}`,
        variant: "destructive",
      });
    }
  }, [addresses, node.job_id, setNodeContent, autoSave, onUpdate, toast]);

  /**
   * Schedule auto-save with debouncing
   */
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveChanges();
    }, debounceMs);
  }, [debounceMs]);

  /**
   * Save all changes
   */
  const saveChanges = useCallback(async () => {
    if (!hasUnsavedChanges || !onUpdate) return;

    try {
      setIsAutoSaving(true);
      await onUpdate(node.id, nodeContent);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      lastContentRef.current = nodeContent;
      
      toast({
        title: "Changes Saved",
        description: "Node content updated successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAutoSaving(false);
    }
  }, [hasUnsavedChanges, onUpdate, node.id, nodeContent, toast]);

  /**
   * Discard unsaved changes
   */
  const discardChanges = useCallback(() => {
    setNodeContent(lastContentRef.current);
    setHasUnsavedChanges(false);
    setFieldErrors({});
  }, [setNodeContent]);

  /**
   * Update entire content structure
   */
  const updateContent = useCallback(async (content: any) => {
    try {
      await HybridAddrService.setItemAt({
        jobId: node.job_id,
        address: addresses.nodeContent(),
        value: content
      });
      
      setNodeContent(content);
      setHasUnsavedChanges(true);
      
      if (autoSave && onUpdate) {
        scheduleAutoSave();
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update node content",
        variant: "destructive",
      });
    }
  }, [addresses, node.job_id, setNodeContent, autoSave, onUpdate, scheduleAutoSave, toast]);

  /**
   * Validate a single field
   */
  const validateField = useCallback(async (fieldRef: string): Promise<boolean> => {
    // Implementation would depend on field validation rules
    // For now, just check if required fields have values
    const value = getFieldValue(fieldRef);
    const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
    
    if (isEmpty) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldRef]: `${fieldRef} is required`
      }));
      return false;
    }
    
    // Clear any existing error
    setFieldErrors(prev => {
      const updated = { ...prev };
      delete updated[fieldRef];
      return updated;
    });
    
    return true;
  }, [getFieldValue]);

  /**
   * Validate all fields in the node
   */
  const validateAllFields = useCallback(async (): Promise<boolean> => {
    if (!nodeContent?.items) return true;
    
    const fieldRefs: string[] = [];
    
    // Collect all field refs recursively
    const collectFieldRefs = (items: any[]) => {
      items.forEach(item => {
        if (item.kind === 'FieldItem' && item.ref) {
          fieldRefs.push(item.ref);
        }
        if (item.children) collectFieldRefs(item.children);
        if (item.instances) {
          item.instances.forEach((instance: any) => {
            if (instance.children) collectFieldRefs(instance.children);
          });
        }
      });
    };
    
    collectFieldRefs(nodeContent.items);
    
    // Validate each field
    const results = await Promise.all(
      fieldRefs.map(ref => validateField(ref))
    );
    
    return results.every(result => result);
  }, [nodeContent, validateField]);

  // Track content changes
  useEffect(() => {
    if (lastContentRef.current && nodeContent !== lastContentRef.current) {
      setHasUnsavedChanges(true);
    }
  }, [nodeContent]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Data access
    nodeContent: nodeContent || {},
    getFieldValue,
    setFieldValue,
    
    // Bulk operations
    updateContent,
    refreshContent,
    
    // State tracking
    hasUnsavedChanges,
    isAutoSaving,
    lastSaved,
    
    // Field-level state
    fieldErrors,
    fieldStates,
    
    // Actions
    saveChanges,
    discardChanges,
    
    // Validation
    validateField,
    validateAllFields,
    
    // Address utilities
    addresses
  };
}