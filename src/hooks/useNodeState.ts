import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { JobNode } from '@/hooks/useJobs';

interface UseNodeStateReturn {
  nodeContent: any;
  updateField: (fieldRef: string, value: any) => void;
  hasUnsavedChanges: boolean;
  isAutoSaving: boolean;
  fieldErrors: Record<string, string>;
  saveChanges: () => Promise<void>;
}

export function useNodeState(
  node: JobNode,
  onUpdate: (nodeId: string, content: any) => Promise<void>
): UseNodeStateReturn {
  const { toast } = useToast();
  const [nodeContent, setNodeContent] = useState(node.content || {});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedContentRef = useRef(node.content);

  // Update local content when node changes
  useEffect(() => {
    setNodeContent(node.content || {});
    lastSavedContentRef.current = node.content;
    setHasUnsavedChanges(false);
  }, [node.content]);

  // Auto-save with debounce
  const saveChanges = useCallback(async () => {
    if (!hasUnsavedChanges) return;

    try {
      setIsAutoSaving(true);
      await onUpdate(node.id, nodeContent);
      lastSavedContentRef.current = nodeContent;
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save node changes:', error);
      toast({
        title: "Save failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAutoSaving(false);
    }
  }, [hasUnsavedChanges, nodeContent, onUpdate, node.id, toast]);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveChanges();
    }, 300); // 300ms debounce
  }, [saveChanges]);

  const updateField = useCallback((fieldRef: string, value: any) => {
    setNodeContent(prev => {
      const updated = { ...prev };
      
      // Update the field value in the items array
      if (updated.items && Array.isArray(updated.items)) {
        updated.items = updated.items.map((item: any) => {
          if (item.ref === fieldRef && item.kind === 'FieldItem') {
            return { ...item, value };
          }
          return item;
        });
      }
      
      return updated;
    });
    
    setHasUnsavedChanges(true);
    
    // Clear any existing error for this field
    setFieldErrors(prev => {
      const updated = { ...prev };
      delete updated[fieldRef];
      return updated;
    });
    
    debouncedSave();
  }, [debouncedSave]);

  // Validate fields
  const validateField = useCallback((fieldRef: string, value: any, rules: any) => {
    const errors: string[] = [];
    
    if (rules?.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push('This field is required');
    }
    
    if (value && typeof value === 'string') {
      if (rules?.minLength && value.length < rules.minLength) {
        errors.push(`Must be at least ${rules.minLength} characters`);
      }
      if (rules?.maxLength && value.length > rules.maxLength) {
        errors.push(`Must be no more than ${rules.maxLength} characters`);
      }
      if (rules?.pattern && !new RegExp(rules.pattern).test(value)) {
        errors.push('Invalid format');
      }
    }
    
    if (Array.isArray(value)) {
      if (rules?.minItems && value.length < rules.minItems) {
        errors.push(`Must have at least ${rules.minItems} items`);
      }
      if (rules?.maxItems && value.length > rules.maxItems) {
        errors.push(`Must have no more than ${rules.maxItems} items`);
      }
    }
    
    if (typeof value === 'number') {
      if (rules?.min && value < rules.min) {
        errors.push(`Must be at least ${rules.min}`);
      }
      if (rules?.max && value > rules.max) {
        errors.push(`Must be no more than ${rules.max}`);
      }
    }
    
    return errors.length > 0 ? errors[0] : null;
  }, []);

  // Validate all fields when content changes
  useEffect(() => {
    if (!nodeContent.items) return;
    
    const newErrors: Record<string, string> = {};
    
    nodeContent.items.forEach((item: any) => {
      if (item.kind === 'FieldItem' && item.rules) {
        const error = validateField(item.ref, item.value, item.rules);
        if (error) {
          newErrors[item.ref] = error;
        }
      }
    });
    
    setFieldErrors(newErrors);
  }, [nodeContent, validateField]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    nodeContent,
    updateField,
    hasUnsavedChanges,
    isAutoSaving,
    fieldErrors,
    saveChanges
  };
}