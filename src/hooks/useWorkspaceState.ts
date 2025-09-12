import { useState, useCallback, useReducer, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';
import { useJobData } from '@/hooks/useJobData';
import { WORKSPACE_SECTIONS } from '@/config/workspace';

// Types for workspace state
export interface WorkspaceJob {
  id: string;
  status?: 'draft' | 'processing' | 'completed' | 'failed';
  user_input: any;
  movie_info?: any;
  characters?: any;
  props?: any;
  timeline?: any;
  music?: any;
  created_at: string;
  updated_at: string;
  [key: string]: any; // For dynamic section data and timestamps
}

export interface WorkspaceState {
  job: WorkspaceJob | null;
  loading: boolean;
  error: string | null;
  
  // Section states
  activeSections: Set<string>;
  sectionData: Record<string, any>;
  sectionValidation: Record<string, {
    status: 'idle' | 'validating' | 'valid' | 'invalid';
    message?: { en?: string; ar?: string };
    suggestedFix?: any;
  }>;
  
  // Generation states
  generationQueue: string[];
  generatingSection: string | null;
  generationProgress: Record<string, number>;
  
  // UI states
  openSections: Set<string>;
  editMode: Record<string, boolean>;
  unsavedChanges: Set<string>;
}

type WorkspaceAction = 
  | { type: 'SET_JOB'; payload: WorkspaceJob | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_SECTION_DATA'; payload: { section: string; data: any } }
  | { type: 'SET_SECTION_VALIDATION'; payload: { section: string; validation: any } }
  | { type: 'START_GENERATION'; payload: string }
  | { type: 'COMPLETE_GENERATION'; payload: string }
  | { type: 'SET_GENERATION_PROGRESS'; payload: { section: string; progress: number } }
  | { type: 'TOGGLE_SECTION'; payload: string }
  | { type: 'SET_EDIT_MODE'; payload: { section: string; enabled: boolean } }
  | { type: 'MARK_UNSAVED'; payload: string }
  | { type: 'MARK_SAVED'; payload: string }
  | { type: 'RESET_STATE' };

const initialState: WorkspaceState = {
  job: null,
  loading: true,
  error: null,
  activeSections: new Set(),
  sectionData: {},
  sectionValidation: {},
  generationQueue: [],
  generatingSection: null,
  generationProgress: {},
  openSections: new Set(['user_input']), // Start with user input section open
  editMode: {},
  unsavedChanges: new Set()
};

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'SET_JOB':
      return { 
        ...state, 
        job: action.payload,
        loading: false,
        // Initialize section data from job
        sectionData: action.payload ? extractSectionData(action.payload) : {}
      };
      
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
      
    case 'UPDATE_SECTION_DATA':
      return {
        ...state,
        sectionData: {
          ...state.sectionData,
          [action.payload.section]: {
            ...state.sectionData[action.payload.section],
            ...action.payload.data
          }
        }
      };
      
    case 'SET_SECTION_VALIDATION':
      return {
        ...state,
        sectionValidation: {
          ...state.sectionValidation,
          [action.payload.section]: action.payload.validation
        }
      };
      
    case 'START_GENERATION':
      return {
        ...state,
        generatingSection: action.payload,
        generationQueue: [...state.generationQueue, action.payload],
        generationProgress: {
          ...state.generationProgress,
          [action.payload]: 0
        }
      };
      
    case 'COMPLETE_GENERATION':
      return {
        ...state,
        generatingSection: state.generatingSection === action.payload ? null : state.generatingSection,
        generationQueue: state.generationQueue.filter(s => s !== action.payload),
        generationProgress: {
          ...state.generationProgress,
          [action.payload]: 100
        }
      };
      
    case 'SET_GENERATION_PROGRESS':
      return {
        ...state,
        generationProgress: {
          ...state.generationProgress,
          [action.payload.section]: action.payload.progress
        }
      };
      
    case 'TOGGLE_SECTION':
      const newOpenSections = new Set(state.openSections);
      if (newOpenSections.has(action.payload)) {
        newOpenSections.delete(action.payload);
      } else {
        newOpenSections.add(action.payload);
      }
      return { ...state, openSections: newOpenSections };
      
    case 'SET_EDIT_MODE':
      return {
        ...state,
        editMode: {
          ...state.editMode,
          [action.payload.section]: action.payload.enabled
        }
      };
      
    case 'MARK_UNSAVED':
      return {
        ...state,
        unsavedChanges: new Set([...state.unsavedChanges, action.payload])
      };
      
    case 'MARK_SAVED':
      const newUnsaved = new Set(state.unsavedChanges);
      newUnsaved.delete(action.payload);
      return { ...state, unsavedChanges: newUnsaved };
      
    case 'RESET_STATE':
      return initialState;
      
    default:
      return state;
  }
}

// Helper function to extract section data from job
function extractSectionData(job: WorkspaceJob): Record<string, any> {
  const sectionData: Record<string, any> = {};
  
  WORKSPACE_SECTIONS.forEach(section => {
    if (job[section.key]) {
      sectionData[section.key] = job[section.key];
    }
  });
  
  return sectionData;
}

export function useWorkspaceState(jobId: string) {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);
  const { user } = useAuth();
  const { sessionId } = useGuestSession();
  const { job, isLoading, error, updateJob, autoSave } = useJobData(jobId);
  
  // Auto-save functionality with debouncing
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Update state when job data changes
  useEffect(() => {
    if (isLoading) {
      dispatch({ type: 'SET_LOADING', payload: true });
    } else if (error) {
      dispatch({ type: 'SET_ERROR', payload: error });
    } else {
      dispatch({ type: 'SET_JOB', payload: job });
    }
  }, [job, isLoading, error]);
  
  // Actions
  const setJob = useCallback((job: WorkspaceJob | null) => {
    dispatch({ type: 'SET_JOB', payload: job });
  }, []);
  
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);
  
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);
  
  const updateSectionData = useCallback((section: string, data: any) => {
    dispatch({ type: 'UPDATE_SECTION_DATA', payload: { section, data } });
    dispatch({ type: 'MARK_UNSAVED', payload: section });
    
    // Schedule auto-save
    scheduleAutoSave(section, data);
  }, []);
  
  const setSectionValidation = useCallback((section: string, validation: any) => {
    dispatch({ type: 'SET_SECTION_VALIDATION', payload: { section, validation } });
  }, []);
  
  const startGeneration = useCallback((section: string) => {
    dispatch({ type: 'START_GENERATION', payload: section });
  }, []);
  
  const completeGeneration = useCallback((section: string) => {
    dispatch({ type: 'COMPLETE_GENERATION', payload: section });
  }, []);
  
  const setGenerationProgress = useCallback((section: string, progress: number) => {
    dispatch({ type: 'SET_GENERATION_PROGRESS', payload: { section, progress } });
  }, []);
  
  const toggleSection = useCallback((section: string) => {
    dispatch({ type: 'TOGGLE_SECTION', payload: section });
  }, []);
  
  const setEditMode = useCallback((section: string, enabled: boolean) => {
    dispatch({ type: 'SET_EDIT_MODE', payload: { section, enabled } });
  }, []);
  
  const markSaved = useCallback((section: string) => {
    dispatch({ type: 'MARK_SAVED', payload: section });
  }, []);
  
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);
  
  // Auto-save with debouncing
  const scheduleAutoSave = useCallback((section: string, data: any) => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    const timer = setTimeout(() => {
      autoSave({ section, data });
      dispatch({ type: 'MARK_SAVED', payload: section });
    }, 2000); // 2 second debounce
    
    setAutoSaveTimer(timer);
  }, [autoSaveTimer, autoSave]);
  
  // Manual save function
  const saveAll = useCallback(() => {
    const unsavedSections = Array.from(state.unsavedChanges);
    unsavedSections.forEach(section => {
      const sectionData = state.sectionData[section];
      if (sectionData) {
        updateJob({ section, data: sectionData });
        dispatch({ type: 'MARK_SAVED', payload: section });
      }
    });
  }, [state.unsavedChanges, state.sectionData, updateJob]);
  
  // Cleanup auto-save timer
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);
  
  return {
    state,
    actions: {
      setJob,
      setLoading,
      setError,
      updateSectionData,
      setSectionValidation,
      startGeneration,
      completeGeneration,
      setGenerationProgress,
      toggleSection,
      setEditMode,
      markSaved,
      resetState,
      saveAll
    }
  };
}