// Hook to use the systematic workspace configuration
import { useState, useCallback, useMemo } from 'react';
import { 
  WORKSPACE_SYSTEM_CONFIG, 
  getSectionConfig, 
  getActionConfig, 
  validateSectionData,
  WorkspaceSectionConfig,
  WorkspaceActionConfig
} from '@/config/workspace-system';
import { useN8nFunctions } from './useN8nFunctions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface WorkspaceSystemState {
  job: any;
  sectionData: Record<string, any>;
  editMode: Record<string, boolean>;
  loadingActions: Record<string, boolean>; // "sectionKey:actionKey" format
  validationStatus: Record<string, any>;
  openSections: Set<string>;
}

export function useWorkspaceSystem(jobId: string) {
  const [state, setState] = useState<WorkspaceSystemState>({
    job: null,
    sectionData: {},
    editMode: {},
    loadingActions: {},
    validationStatus: {},
    openSections: new Set(['user_input'])
  });

  // Get all function IDs from config
  const allFunctionIds = useMemo(() => {
    const functionIds: string[] = [];
    WORKSPACE_SYSTEM_CONFIG.forEach(section => {
      Object.entries(section.actions).forEach(([actionKey, action]) => {
        if (actionKey === 'custom' && action) {
          Object.values(action).forEach(customAction => {
            if (customAction.functionId) functionIds.push(customAction.functionId);
          });
        } else if (action && (action as WorkspaceActionConfig).functionId) {
          functionIds.push((action as WorkspaceActionConfig).functionId!);
        }
      });
    });
    return [...new Set(functionIds)];
  }, []);

  const { byName: fnByName, loading: functionsLoading } = useN8nFunctions(allFunctionIds);

  // Execute an action based on configuration
  const executeAction = useCallback(async (
    sectionKey: string, 
    actionKey: string, 
    additionalData?: any
  ): Promise<boolean> => {
    const sectionConfig = getSectionConfig(sectionKey);
    const actionConfig = getActionConfig(sectionKey, actionKey);
    
    if (!sectionConfig || !actionConfig || !actionConfig.enabled) {
      toast({ title: 'Error', description: 'Action not available', variant: 'destructive' });
      return false;
    }

    const loadingKey = `${sectionKey}:${actionKey}`;
    
    // Set loading state
    setState(prev => ({
      ...prev,
      loadingActions: { ...prev.loadingActions, [loadingKey]: true }
    }));

    try {
      const currentSectionData = sectionConfig.data.extractFromJob 
        ? sectionConfig.data.extractFromJob(state.job)
        : state.sectionData[sectionKey];

      // Check dependencies
      if (actionConfig.requiresData) {
        for (const requiredSection of actionConfig.requiresData) {
          const requiredData = state.sectionData[requiredSection] || 
                             (state.job && getSectionConfig(requiredSection)?.data.extractFromJob?.(state.job));
          
          if (!requiredData) {
            toast({ 
              title: 'Missing Data', 
              description: `Please complete the ${requiredSection} section first`, 
              variant: 'destructive' 
            });
            return false;
          }
        }
      }

      // Custom action (non-N8N)
      if (actionConfig.customAction) {
        await actionConfig.customAction(state.job, currentSectionData, {
          updateJob: async (updates: any) => {
            // Update job in database
            const { error } = await supabase
              .from('storyboard_jobs')
              .update(updates)
              .eq('id', jobId);
            
            if (error) throw error;
            
            // Update local state
            setState(prev => ({
              ...prev,
              job: { ...prev.job, ...updates }
            }));
          },
          updateSection: (data: any) => {
            setState(prev => ({
              ...prev,
              sectionData: { ...prev.sectionData, [sectionKey]: data }
            }));
          }
        });
        
        toast({ title: 'Success', description: `${actionKey} completed successfully` });
        return true;
      }

      // N8N function action
      if (actionConfig.functionId) {
        const functionRecord = fnByName[actionConfig.functionId];
        if (!functionRecord) {
          toast({ title: 'Error', description: 'Function not available', variant: 'destructive' });
          return false;
        }

        // Build payload
        const payload = actionConfig.payload 
          ? actionConfig.payload(state.job, currentSectionData, additionalData)
          : { table_id: 'storyboard_jobs', row_id: jobId };

        // Execute N8N function
        const { data: envelope, error } = await supabase.functions.invoke('execute-function', {
          body: {
            function_id: functionRecord.id,
            payload,
            user_id: state.job?.user_id || null
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (envelope?.status === 'error') {
          const msg = typeof envelope?.error?.message === 'string' 
            ? envelope.error.message 
            : (envelope?.error?.message?.en || envelope?.error?.message?.ar || 'Failed');
          throw new Error(msg);
        }

        // Handle success
        if (actionConfig.onSuccess) {
          actionConfig.onSuccess(envelope, (data: any) => {
            setState(prev => ({
              ...prev,
              sectionData: { ...prev.sectionData, [sectionKey]: data }
            }));
          });
        } else {
          // Default success handling - refetch section data
          const { data: refetched } = await supabase
            .from('storyboard_jobs')
            .select(`${sectionKey}, ${sectionKey}_updated_at`)
            .eq('id', jobId)
            .maybeSingle();
          
          if (refetched?.[sectionKey]) {
            setState(prev => ({
              ...prev,
              sectionData: { ...prev.sectionData, [sectionKey]: refetched[sectionKey] }
            }));
          }
        }

        toast({ 
          title: 'Success', 
          description: `${actionConfig.labelKey || actionKey} completed successfully` 
        });
        return true;
      }

      return false;

    } catch (error: any) {
      console.error(`Error executing ${sectionKey}:${actionKey}:`, error);
      
      if (actionConfig.onError) {
        actionConfig.onError(error);
      } else {
        toast({ 
          title: 'Error', 
          description: error.message || 'An error occurred', 
          variant: 'destructive' 
        });
      }
      return false;
      
    } finally {
      // Clear loading state
      setState(prev => ({
        ...prev,
        loadingActions: { ...prev.loadingActions, [loadingKey]: false }
      }));
    }
  }, [state.job, state.sectionData, fnByName, jobId]);

  // Helper functions for common actions
  const actions = useMemo(() => ({
    toggleEditMode: (sectionKey: string) => {
      setState(prev => ({
        ...prev,
        editMode: {
          ...prev.editMode,
          [sectionKey]: !prev.editMode[sectionKey]
        }
      }));
    },

    updateSectionData: (sectionKey: string, data: any) => {
      setState(prev => ({
        ...prev,
        sectionData: { ...prev.sectionData, [sectionKey]: data }
      }));
    },

    toggleSection: (sectionKey: string) => {
      setState(prev => {
        const newOpenSections = new Set(prev.openSections);
        if (newOpenSections.has(sectionKey)) {
          newOpenSections.delete(sectionKey);
        } else {
          newOpenSections.add(sectionKey);
        }
        return { ...prev, openSections: newOpenSections };
      });
    },

    validateSection: (sectionKey: string) => {
      const sectionConfig = getSectionConfig(sectionKey);
      if (!sectionConfig) return;

      const currentData = sectionConfig.data.extractFromJob 
        ? sectionConfig.data.extractFromJob(state.job)
        : state.sectionData[sectionKey];

      const validation = validateSectionData(sectionKey, currentData);
      
      setState(prev => ({
        ...prev,
        validationStatus: {
          ...prev.validationStatus,
          [sectionKey]: {
            status: validation.valid ? 'valid' : 'invalid',
            errors: validation.errors
          }
        }
      }));

      return validation;
    },

    // Convenience methods for common actions
    generate: (sectionKey: string, additionalData?: any) => 
      executeAction(sectionKey, 'generate', additionalData),
    
    regenerate: (sectionKey: string, additionalData?: any) => 
      executeAction(sectionKey, 'regenerate', additionalData),
    
    validate: (sectionKey: string, additionalData?: any) => 
      executeAction(sectionKey, 'validate', additionalData),
    
    save: (sectionKey: string, additionalData?: any) => 
      executeAction(sectionKey, 'save', additionalData),
    
    customAction: (sectionKey: string, actionKey: string, additionalData?: any) =>
      executeAction(sectionKey, actionKey, additionalData)

  }), [executeAction, state.job, state.sectionData]);

  // Get action availability and loading states
  const getActionState = useCallback((sectionKey: string, actionKey: string) => {
    const actionConfig = getActionConfig(sectionKey, actionKey);
    const loadingKey = `${sectionKey}:${actionKey}`;
    
    return {
      available: actionConfig?.enabled || false,
      loading: state.loadingActions[loadingKey] || false,
      creditCost: actionConfig?.creditCost || 0,
      estimatedTime: actionConfig?.estimatedTime || null,
      functionId: actionConfig?.functionId || null
    };
  }, [state.loadingActions]);

  return {
    state,
    actions,
    config: WORKSPACE_SYSTEM_CONFIG,
    getActionState,
    executeAction,
    functionsLoading,
    functionsByName: fnByName
  };
}