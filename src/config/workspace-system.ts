// Systematic Workspace Configuration System
// This file centralizes ALL workspace section definitions, button behaviors, and function mappings

import { LucideIcon } from 'lucide-react';

// ============= CORE TYPES =============

export interface WorkspaceFieldConfig {
  key: string;
  type: 'text' | 'textarea' | 'select' | 'file' | 'multiselect' | 'character' | 'custom';
  labelKey: string; // Translation key
  placeholderKey?: string;
  required?: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
  };
  options?: { value: string; labelKey: string }[];
  subFields?: WorkspaceFieldConfig[]; // For nested fields like character details
}

export interface WorkspaceActionConfig {
  enabled: boolean;
  labelKey?: string; // Translation key for button text
  functionId?: string; // N8N function ID to call
  creditCost?: number;
  estimatedTime?: string;
  requiresData?: string[]; // Required section keys that must have data
  payload?: (job: any, sectionData: any, additionalData?: any) => any; // Function to build payload
  onSuccess?: (result: any, updateSection: (data: any) => void) => void; // Handle success response
  onError?: (error: any) => void; // Handle error response
  customAction?: (job: any, sectionData: any, actions: any) => Promise<void>; // For non-N8N actions
}

export interface WorkspaceSectionConfig {
  key: string;
  titleKey: string; // Translation key
  icon: string; // Lucide icon name
  description?: string;
  order: number; // Display order
  
  // Dependencies and relationships
  dependencies?: string[]; // Sections this depends on
  affectedSections?: string[]; // Sections affected when this changes
  
  // Field configuration
  fields: WorkspaceFieldConfig[];
  
  // Action configurations
  actions: {
    edit?: WorkspaceActionConfig; // Edit mode toggle
    save?: WorkspaceActionConfig; // Save changes
    generate?: WorkspaceActionConfig; // Generate new content
    regenerate?: WorkspaceActionConfig; // Regenerate existing content
    validate?: WorkspaceActionConfig; // Validate content
    delete?: WorkspaceActionConfig; // Delete content
    custom?: Record<string, WorkspaceActionConfig>; // Custom actions
  };
  
  // UI Configuration
  ui: {
    collapsible: boolean;
    defaultOpen?: boolean;
    editMode?: boolean; // Whether this section supports edit mode
    showValidationStatus?: boolean;
    showGenerationProgress?: boolean;
    customComponent?: string; // Name of custom component to render
    mobileConfig?: {
      stackFields?: boolean;
      hideOnMobile?: boolean;
      customLayout?: boolean;
    };
  };
  
  // Data handling
  data: {
    defaultValue?: any;
    extractFromJob?: (job: any) => any; // How to extract data from job
    saveToJob?: (job: any, data: any) => any; // How to save data back to job
    validate?: (data: any) => { valid: boolean; errors?: string[] }; // Client-side validation
  };
}

// ============= CONFIGURATION =============

export const WORKSPACE_SYSTEM_CONFIG: WorkspaceSectionConfig[] = [
  // USER INPUT SECTION
  {
    key: 'user_input',
    titleKey: 'initialInput',
    icon: 'Users',
    order: 1,
    fields: [
      {
        key: 'template',
        type: 'select',
        labelKey: 'template',
        placeholderKey: 'selectTemplate',
        required: false,
        options: [] // Populated dynamically
      },
      {
        key: 'leadName',
        type: 'text',
        labelKey: 'leadCharacterName',
        placeholderKey: 'enterCharacterName',
        required: true,
        validation: { minLength: 2, maxLength: 50 }
      },
      {
        key: 'leadGender',
        type: 'select',
        labelKey: 'leadCharacterGender',
        required: true,
        options: [
          { value: 'male', labelKey: 'male' },
          { value: 'female', labelKey: 'female' }
        ]
      },
      {
        key: 'language',
        type: 'select',
        labelKey: 'language',
        required: true,
        options: [
          { value: 'English', labelKey: 'englishLang' },
          { value: 'Arabic', labelKey: 'arabicLang' }
        ]
      },
      {
        key: 'accent',
        type: 'select',
        labelKey: 'accent',
        required: true,
        options: [] // Populated based on language
      },
      {
        key: 'prompt',
        type: 'textarea',
        labelKey: 'storyPrompt',
        placeholderKey: 'enterYourStoryIdea',
        required: true,
        validation: { minLength: 20, maxLength: 1000 }
      }
    ],
    actions: {
      edit: {
        enabled: true,
        labelKey: 'editInput'
      },
      save: {
        enabled: true,
        labelKey: 'saveChanges',
        customAction: async (job, sectionData, actions) => {
          // Save user input changes
          await actions.updateJob({ user_input: sectionData });
        }
      }
    },
    ui: {
      collapsible: true,
      defaultOpen: false,
      editMode: true,
      customComponent: 'UserInputSection'
    },
    data: {
      extractFromJob: (job) => job.user_input,
      saveToJob: (job, data) => ({ ...job, user_input: data }),
      validate: (data) => ({
        valid: !!(data.leadName && data.leadGender && data.language && data.prompt),
        errors: []
      })
    }
  },

  // MOVIE INFO SECTION
  {
    key: 'movie_info',
    titleKey: 'movieInformation',
    icon: 'Film',
    order: 2,
    dependencies: ['user_input'],
    affectedSections: ['characters', 'props', 'timeline', 'music'],
    fields: [
      {
        key: 'title',
        type: 'text',
        labelKey: 'movieTitle',
        placeholderKey: 'enterMovieTitle',
        required: true,
        validation: { minLength: 2, maxLength: 100 }
      },
      {
        key: 'logline',
        type: 'textarea',
        labelKey: 'logline',
        placeholderKey: 'enterLogline',
        required: true,
        validation: { minLength: 20, maxLength: 500 }
      },
      {
        key: 'world',
        type: 'textarea',
        labelKey: 'world',
        placeholderKey: 'describeWorld',
        required: true,
        validation: { minLength: 20, maxLength: 500 }
      },
      {
        key: 'look',
        type: 'textarea',
        labelKey: 'visualStyle',
        placeholderKey: 'describeVisualStyle',
        required: true,
        validation: { minLength: 20, maxLength: 500 }
      }
    ],
    actions: {
      generate: {
        enabled: true,
        labelKey: 'generateMovieInfo',
        functionId: 'generate-movie-info',
        creditCost: 1,
        estimatedTime: '30s',
        requiresData: ['user_input'],
        payload: (job) => ({ table_id: 'storyboard_jobs', row_id: job.id }),
        onSuccess: (result, updateSection) => {
          // Refetch movie_info from database
          // This will be handled by the action system
        }
      },
      regenerate: {
        enabled: true,
        labelKey: 'regenerateMovieInfo',
        functionId: 'generate-movie-info',
        creditCost: 1,
        estimatedTime: '30s',
        requiresData: ['user_input'],
        payload: (job) => ({ table_id: 'storyboard_jobs', row_id: job.id }),
        onSuccess: (result, updateSection) => {
          // Refetch movie_info from database
        }
      },
      validate: {
        enabled: true,
        labelKey: 'validateChanges',
        functionId: 'validate-movie-info',
        creditCost: 0.5,
        estimatedTime: '10s',
        payload: (job, sectionData, edits) => ({ 
          table_id: 'storyboard_jobs', 
          row_id: job.id, 
          edits 
        }),
        onSuccess: (result, updateSection) => {
          // Handle validation result
        }
      },
      edit: {
        enabled: true,
        labelKey: 'editMovieInfo'
      },
      save: {
        enabled: true,
        labelKey: 'saveChanges',
        customAction: async (job, sectionData, actions) => {
          await actions.updateJob({ movie_info: sectionData });
        }
      }
    },
    ui: {
      collapsible: true,
      defaultOpen: false,
      editMode: true,
      showValidationStatus: true,
      showGenerationProgress: true,
      customComponent: 'MovieInfoSection'
    },
    data: {
      extractFromJob: (job) => job.movie_info,
      saveToJob: (job, data) => ({ ...job, movie_info: data }),
      validate: (data) => ({
        valid: !!(data.title && data.logline && data.world && data.look),
        errors: []
      })
    }
  },

  // CHARACTERS SECTION
  {
    key: 'characters',
    titleKey: 'characters',
    icon: 'Users',
    order: 3,
    dependencies: ['movie_info'],
    affectedSections: ['props', 'timeline', 'music'],
    fields: [
      {
        key: 'lead',
        type: 'character',
        labelKey: 'leadCharacter',
        required: true,
        subFields: [
          { key: 'name', type: 'text', labelKey: 'characterName', required: true },
          { key: 'gender', type: 'select', labelKey: 'gender', required: true, options: [
            { value: 'male', labelKey: 'male' },
            { value: 'female', labelKey: 'female' }
          ]},
          { key: 'description', type: 'textarea', labelKey: 'characterDescription' },
          { key: 'portrait', type: 'file', labelKey: 'characterPortrait' }
        ]
      },
      {
        key: 'supporting',
        type: 'character',
        labelKey: 'supportingCharacters',
        required: false,
        subFields: [
          { key: 'name', type: 'text', labelKey: 'characterName', required: true },
          { key: 'gender', type: 'select', labelKey: 'gender', required: true, options: [
            { value: 'male', labelKey: 'male' },
            { value: 'female', labelKey: 'female' }
          ]},
          { key: 'description', type: 'textarea', labelKey: 'characterDescription' },
          { key: 'portrait', type: 'file', labelKey: 'characterPortrait' }
        ]
      }
    ],
    actions: {
      edit: {
        enabled: true,
        labelKey: 'editCharacters'
      },
      save: {
        enabled: true,
        labelKey: 'saveChanges',
        customAction: async (job, sectionData, actions) => {
          await actions.updateJob({ characters: sectionData });
        }
      },
      custom: {
        'generate-lead-description': {
          enabled: true,
          labelKey: 'generateDescription',
          functionId: 'generate-character-description',
          creditCost: 1,
          estimatedTime: '25s',
          payload: (job, sectionData) => ({ 
            table_id: 'storyboard_jobs', 
            row_id: job.id, 
            character_type: 'lead' 
          })
        },
        'generate-supporting-description': {
          enabled: true,
          labelKey: 'generateDescription',
          functionId: 'generate-character-description',
          creditCost: 1,
          estimatedTime: '25s',
          payload: (job, sectionData) => ({ 
            table_id: 'storyboard_jobs', 
            row_id: job.id, 
            character_type: 'supporting' 
          })
        },
        'generate-lead-portrait': {
          enabled: true,
          labelKey: 'generatePortrait',
          functionId: 'generate-character-portrait',
          creditCost: 2,
          estimatedTime: '45s',
          payload: (job, sectionData) => ({ 
            table_id: 'storyboard_jobs', 
            row_id: job.id, 
            character_type: 'lead' 
          })
        },
        'generate-supporting-portrait': {
          enabled: true,
          labelKey: 'generatePortrait',
          functionId: 'generate-character-portrait',
          creditCost: 2,
          estimatedTime: '45s',
          payload: (job, sectionData) => ({ 
            table_id: 'storyboard_jobs', 
            row_id: job.id, 
            character_type: 'supporting' 
          })
        }
      }
    },
    ui: {
      collapsible: true,
      defaultOpen: false,
      editMode: true,
      showValidationStatus: true,
      customComponent: 'CharactersSection'
    },
    data: {
      extractFromJob: (job) => job.characters,
      saveToJob: (job, data) => ({ ...job, characters: data }),
      validate: (data) => ({
        valid: !!(data?.lead?.name && data?.lead?.gender),
        errors: []
      })
    }
  },

  // PROPS SECTION
  {
    key: 'props',
    titleKey: 'propsAndItems',
    icon: 'Package',
    order: 4,
    dependencies: ['characters'],
    affectedSections: ['timeline', 'music'],
    fields: [
      {
        key: 'items',
        type: 'textarea',
        labelKey: 'propsDescription',
        placeholderKey: 'describeProps',
        required: false,
        validation: { maxLength: 1000 }
      }
    ],
    actions: {
      generate: {
        enabled: true,
        labelKey: 'generateProps',
        functionId: 'generate-props',
        creditCost: 1,
        estimatedTime: '20s',
        requiresData: ['characters'],
        payload: (job) => ({ table_id: 'storyboard_jobs', row_id: job.id })
      },
      edit: {
        enabled: true,
        labelKey: 'editProps'
      },
      save: {
        enabled: true,
        labelKey: 'saveChanges',
        customAction: async (job, sectionData, actions) => {
          await actions.updateJob({ props: sectionData });
        }
      }
    },
    ui: {
      collapsible: true,
      defaultOpen: false,
      editMode: true,
      showGenerationProgress: true
    },
    data: {
      extractFromJob: (job) => job.props,
      saveToJob: (job, data) => ({ ...job, props: data })
    }
  },

  // TIMELINE SECTION  
  {
    key: 'timeline',
    titleKey: 'timelineAndShots',
    icon: 'Play',
    order: 5,
    dependencies: ['props'],
    affectedSections: ['music'],
    fields: [
      {
        key: 'clips',
        type: 'custom',
        labelKey: 'shotSequence',
        required: true
      }
    ],
    actions: {
      generate: {
        enabled: true,
        labelKey: 'generateTimeline',
        functionId: 'generate-timeline',
        creditCost: 2,
        estimatedTime: '60s',
        requiresData: ['props'],
        payload: (job) => ({ table_id: 'storyboard_jobs', row_id: job.id })
      },
      edit: {
        enabled: true,
        labelKey: 'editTimeline'
      },
      save: {
        enabled: true,
        labelKey: 'saveChanges',
        customAction: async (job, sectionData, actions) => {
          await actions.updateJob({ timeline: sectionData });
        }
      }
    },
    ui: {
      collapsible: true,
      defaultOpen: false,
      editMode: true,
      showGenerationProgress: true,
      customComponent: 'TimelineSection'
    },
    data: {
      extractFromJob: (job) => job.timeline,
      saveToJob: (job, data) => ({ ...job, timeline: data })
    }
  },

  // MUSIC SECTION
  {
    key: 'music',
    titleKey: 'musicAndAudio',
    icon: 'Music',
    order: 6,
    dependencies: ['timeline'],
    fields: [
      {
        key: 'prefs',
        type: 'textarea',
        labelKey: 'musicPreferences',
        placeholderKey: 'describeMusicStyle',
        required: false,
        validation: { maxLength: 500 }
      },
      {
        key: 'music_url',
        type: 'text',
        labelKey: 'musicUrl',
        placeholderKey: 'pasteYouTubeUrl',
        required: false
      }
    ],
    actions: {
      generate: {
        enabled: true,
        labelKey: 'generateMusic',
        functionId: 'generate-music',
        creditCost: 3,
        estimatedTime: '90s',
        requiresData: ['timeline'],
        payload: (job) => ({ table_id: 'storyboard_jobs', row_id: job.id })
      },
      edit: {
        enabled: true,
        labelKey: 'editMusic'
      },
      save: {
        enabled: true,
        labelKey: 'saveChanges',
        customAction: async (job, sectionData, actions) => {
          await actions.updateJob({ music: sectionData });
        }
      }
    },
    ui: {
      collapsible: true,
      defaultOpen: false,
      editMode: true,
      showGenerationProgress: true
    },
    data: {
      extractFromJob: (job) => job.music,
      saveToJob: (job, data) => ({ ...job, music: data })
    }
  }
];

// ============= HELPER FUNCTIONS =============

export function getSectionConfig(key: string): WorkspaceSectionConfig | undefined {
  return WORKSPACE_SYSTEM_CONFIG.find(section => section.key === key);
}

export function getSectionsByOrder(): WorkspaceSectionConfig[] {
  return [...WORKSPACE_SYSTEM_CONFIG].sort((a, b) => a.order - b.order);
}

export function getSectionDependencies(key: string): string[] {
  const section = getSectionConfig(key);
  return section?.dependencies || [];
}

export function getSectionsAffectedBy(key: string): string[] {
  const section = getSectionConfig(key);
  return section?.affectedSections || [];
}

export function getAllFunctionIds(): string[] {
  const functionIds: string[] = [];
  
  WORKSPACE_SYSTEM_CONFIG.forEach(section => {
    // Handle standard actions
    const standardActions = [
      section.actions.edit,
      section.actions.save,
      section.actions.generate,
      section.actions.regenerate,
      section.actions.validate,
      section.actions.delete
    ];
    
    standardActions.forEach(action => {
      if (action && action.functionId) {
        functionIds.push(action.functionId);
      }
    });
    
    // Handle custom actions
    if (section.actions.custom) {
      Object.values(section.actions.custom).forEach(action => {
        if (action && action.functionId) {
          functionIds.push(action.functionId);
        }
      });
    }
  });
  
  return [...new Set(functionIds)];
}

export function getActionConfig(sectionKey: string, actionKey: string): WorkspaceActionConfig | undefined {
  const section = getSectionConfig(sectionKey);
  if (!section) return undefined;
  
  if (actionKey in section.actions) {
    return section.actions[actionKey as keyof typeof section.actions] as WorkspaceActionConfig;
  }
  
  return section.actions.custom?.[actionKey];
}

// ============= VALIDATION HELPERS =============

export function validateSectionData(sectionKey: string, data: any): { valid: boolean; errors: string[] } {
  const section = getSectionConfig(sectionKey);
  if (!section) return { valid: false, errors: ['Section not found'] };
  
  // Use section's custom validation if available
  if (section.data.validate) {
    const result = section.data.validate(data);
    return { valid: result.valid, errors: result.errors || [] };
  }
  
  // Default field-based validation
  const errors: string[] = [];
  
  section.fields.forEach(field => {
    if (field.required && (!data || !data[field.key])) {
      errors.push(`Field ${field.key} is required`);
    }
    
    if (field.validation && data?.[field.key]) {
      const value = data[field.key];
      const validation = field.validation;
      
      if (validation.minLength && value.length < validation.minLength) {
        errors.push(`Field ${field.key} must be at least ${validation.minLength} characters`);
      }
      
      if (validation.maxLength && value.length > validation.maxLength) {
        errors.push(`Field ${field.key} must be no more than ${validation.maxLength} characters`);
      }
      
      if (validation.pattern && !validation.pattern.test(value)) {
        errors.push(`Field ${field.key} format is invalid`);
      }
      
      if (validation.custom && !validation.custom(value)) {
        errors.push(`Field ${field.key} is invalid`);
      }
    }
  });
  
  return { valid: errors.length === 0, errors };
}