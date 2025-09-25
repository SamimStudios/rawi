/**
 * Enhanced field-level data management using ltree system
 * Provides isolated field access and updates
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { HybridAddrService } from '@/lib/ltree/service';
import { getFieldAddress, findFieldPaths, validateFieldAddresses } from '@/lib/ltree/fieldResolver';
import type { JobNode } from '@/hooks/useJobs';

export interface UseNodeFieldDataOptions {
  node: JobNode;
  onUpdate?: (nodeId: string, content: any) => Promise<void>;
  autoSave?: boolean;
  debounceMs?: number;
}

export interface FieldState {
  loading: boolean;
  error: string | null;
  lastValue: any;
  isDirty: boolean;
}

export interface UseNodeFieldDataReturn {
  // Content
  nodeContent: any;
  
  // Field operations
  getFieldValue: (fieldRef: string) => any;
  setFieldValue: (fieldRef: string, value: any) => Promise<void>;
  
  // Field state
  fieldStates: Record<string, FieldState>;
  fieldErrors: Record<string, string>;
  
  // Bulk operations
  refreshContent: () => Promise<void>;
  saveAllChanges: () => Promise<void>;
  discardAllChanges: () => void;
  
  // State
  hasUnsavedChanges: boolean;
  isAutoSaving: boolean;
  lastSaved: Date | null;
  
  // Validation
  validateStructure: () => { valid: boolean; errors: string[] };
}

export function useNodeFieldData({
  node,
  onUpdate,
  autoSave = true,
  debounceMs = 300
}: UseNodeFieldDataOptions): UseNodeFieldDataReturn {
  const { toast } = useToast();
  
  // State
  const [nodeContent, setNodeContent] = useState(node.content || {});
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const originalContentRef = useRef(node.content);
  const fieldPathsRef = useRef(new Map());
  
  // Update field paths when content changes
  useEffect(() => {
    try {
      fieldPathsRef.current = findFieldPaths(nodeContent);
    } catch (error) {
      console.error('Failed to build field paths:', error);
    }
  }, [nodeContent]);
  
  // Sync with node changes
  useEffect(() => {
    if (node.content !== originalContentRef.current) {
      setNodeContent(node.content || {});
      originalContentRef.current = node.content;
      setHasUnsavedChanges(false);
    }
  }, [node.content]);
  
  /**
   * Get field value by traversing the actual content structure
   */
  const getFieldValue = useCallback((fieldRef: string): any => {
    const fieldPath = fieldPathsRef.current.get(fieldRef);
    if (!fieldPath) {
      console.warn(`Field ${fieldRef} not found in content structure`);
      return undefined;
    }
    
    try {
      // Parse the JSON path and traverse to get value
      const pathParts = fieldPath.jsonPath.replace(/^content\./, '').split('.');
      let current = nodeContent;
      
      for (const part of pathParts) {
        if (current == null) return undefined;
        
        // Handle array indices
        if (/^\d+$/.test(part)) {
          current = current[parseInt(part)];
        } else {
          current = current[part];
        }
      }
      
      return current;
    } catch (error) {
      console.error(`Failed to get value for field ${fieldRef}:`, error);
      return undefined;
    }
  }, [nodeContent]);
  
  /**
   * Set field value using precise ltree addressing
   */
  const setFieldValue = useCallback(async (fieldRef: string, value: any): Promise<void> => {
    const fieldAddress = getFieldAddress(node.path, nodeContent, fieldRef);
    
    if (!fieldAddress) {
      throw new Error(`Cannot determine address for field ${fieldRef}`);
    }
    
    try {
      // Set loading state
      setFieldStates(prev => ({
        ...prev,
        [fieldRef]: {
          ...prev[fieldRef],
          loading: true,
          error: null
        }
      }));
      
      // Update via ltree
      await HybridAddrService.setItemAt({
        jobId: node.job_id,
        address: fieldAddress,
        value
      });
      
      // Update local content immediately for UI responsiveness
      setNodeContent(prev => {
        const fieldPath = fieldPathsRef.current.get(fieldRef);
        if (!fieldPath) return prev;
        
        const pathParts = fieldPath.jsonPath.replace(/^content\./, '').split('.');
        const newContent = JSON.parse(JSON.stringify(prev));
        
        // Navigate to the parent and set the value
        let current = newContent;
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (/^\d+$/.test(part)) {
            current = current[parseInt(part)];
          } else {
            current = current[part];
          }
        }
        
        const lastPart = pathParts[pathParts.length - 1];
        if (/^\d+$/.test(lastPart)) {
          current[parseInt(lastPart)] = value;
        } else {
          current[lastPart] = value;
        }
        
        return newContent;
      });
      
      // Clear error and update state
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[fieldRef];
        return updated;
      });
      
      setFieldStates(prev => ({
        ...prev,
        [fieldRef]: {
          ...prev[fieldRef],
          loading: false,
          error: null,
          isDirty: true,
          lastValue: value
        }
      }));
      
      setHasUnsavedChanges(true);
      
      // Schedule auto-save
      if (autoSave && onUpdate) {
        scheduleAutoSave();
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update field';
      
      setFieldErrors(prev => ({
        ...prev,
        [fieldRef]: errorMessage
      }));
      
      setFieldStates(prev => ({
        ...prev,
        [fieldRef]: {
          ...prev[fieldRef],
          loading: false,
          error: errorMessage
        }
      }));
      
      throw error;
    }
  }, [node.job_id, node.path, nodeContent, autoSave, onUpdate]);
  
  /**
   * Schedule auto-save with debouncing
   */
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveAllChanges();
    }, debounceMs);
  }, [debounceMs]);
  
  /**
   * Save all pending changes
   */
  const saveAllChanges = useCallback(async () => {
    if (!hasUnsavedChanges || !onUpdate) return;
    
    try {
      setIsAutoSaving(true);
      await onUpdate(node.id, nodeContent);
      
      // Reset dirty states
      setFieldStates(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = { ...updated[key], isDirty: false };
        });
        return updated;
      });
      
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      originalContentRef.current = nodeContent;
      
    } catch (error) {
      console.error('Failed to save changes:', error);
      throw error;
    } finally {
      setIsAutoSaving(false);
    }
  }, [hasUnsavedChanges, onUpdate, node.id, nodeContent]);
  
  /**
   * Discard all unsaved changes
   */
  const discardAllChanges = useCallback(() => {
    setNodeContent(originalContentRef.current || {});
    setFieldErrors({});
    setFieldStates({});
    setHasUnsavedChanges(false);
  }, []);
  
  /**
   * Refresh content from ltree
   */
  const refreshContent = useCallback(async () => {
    try {
      const address = `${node.path}#content`;
      const freshContent = await HybridAddrService.getItemAt({
        jobId: node.job_id,
        address
      });
      
      setNodeContent(freshContent || {});
      originalContentRef.current = freshContent;
      setHasUnsavedChanges(false);
      setFieldErrors({});
      setFieldStates({});
      
    } catch (error) {
      console.error('Failed to refresh content:', error);
      throw error;
    }
  }, [node.job_id, node.path]);
  
  /**
   * Validate field address structure
   */
  const validateStructure = useCallback(() => {
    const validation = validateFieldAddresses(nodeContent);
    
    if (!validation.valid) {
      console.warn('Field address conflicts detected:', validation.duplicates);
    }
    
    return {
      valid: validation.valid,
      errors: validation.duplicates
    };
  }, [nodeContent]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    nodeContent,
    getFieldValue,
    setFieldValue,
    fieldStates,
    fieldErrors,
    refreshContent,
    saveAllChanges,
    discardAllChanges,
    hasUnsavedChanges,
    isAutoSaving,
    lastSaved,
    validateStructure
  };
}