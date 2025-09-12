// Workspace configuration - centralized config for sections, fields, and validation
export interface WorkspaceSection {
  key: string;
  titleKey: string; // Translation key
  icon: string; // lucide icon name
  description?: string;
  generateFunctionId?: string;
  editFunctionId?: string;
  validateFunctionId?: string; 
  fields: WorkspaceField[];
  dependencies?: string[]; // Sections this depends on
  affectedSections?: string[]; // Sections affected when this changes
}

export interface WorkspaceField {
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
  subFields?: WorkspaceField[]; // For nested fields like character details
}

// Main workspace sections configuration
export const WORKSPACE_SECTIONS: WorkspaceSection[] = [
  {
    key: 'user_input',
    titleKey: 'initialInput',
    icon: 'Users',
    description: '',
    fields: []
  },
  {
    key: 'movie_info',
    titleKey: 'movieInformation',
    icon: 'Film',
    generateFunctionId: 'generate-movie-info',
    editFunctionId: 'edit-movie-info',
    validateFunctionId: 'validate-movie-info', 
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
    ]
  },
  {
    key: 'characters',
    titleKey: 'characters',
    icon: 'Users',
    dependencies: ['movie_info'],
    affectedSections: ['props', 'timeline', 'music'],
    fields: [
      {
        key: 'lead',
        type: 'character',
        labelKey: 'leadCharacter',
        required: true,
        subFields: [
          {
            key: 'name',
            type: 'text',
            labelKey: 'characterName',
            required: true,
            validation: { minLength: 2, maxLength: 50 }
          },
          {
            key: 'gender',
            type: 'select',
            labelKey: 'gender',
            required: true,
            options: [
              { value: 'male', labelKey: 'male' },
              { value: 'female', labelKey: 'female' }
            ]
          },
          {
            key: 'faceImage',
            type: 'file',
            labelKey: 'faceReference',
            required: false
          }
        ]
      },
      {
        key: 'supporting',
        type: 'character',
        labelKey: 'supportingCharacters',
        required: false,
        subFields: [
          {
            key: 'name',
            type: 'text',
            labelKey: 'characterName',
            required: true,
            validation: { minLength: 2, maxLength: 50 }
          },
          {
            key: 'gender',
            type: 'select',
            labelKey: 'gender',
            required: true,
            options: [
              { value: 'male', labelKey: 'male' },
              { value: 'female', labelKey: 'female' }
            ]
          },
          {
            key: 'faceImage',
            type: 'file',
            labelKey: 'faceReference',
            required: false
          }
        ]
      }
    ]
  },
  {
    key: 'props',
    titleKey: 'propsAndItems',
    icon: 'Package',
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
    ]
  },
  {
    key: 'timeline',
    titleKey: 'timelineAndShots',
    icon: 'Play',
    dependencies: ['props'],
    affectedSections: ['music'],
    fields: [
      {
        key: 'clips',
        type: 'custom',
        labelKey: 'shotSequence',
        required: true
      }
    ]
  },
  {
    key: 'music',
    titleKey: 'musicAndAudio',
    icon: 'Music',
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
    ]
  }
];

// Language options
export const LANGUAGE_OPTIONS = [
  { value: 'English', labelKey: 'englishLang' },
  { value: 'Arabic', labelKey: 'arabicLang' }
];

// Accent options by language
export const ACCENT_OPTIONS: Record<string, { value: string; labelKey: string }[]> = {
  English: [
    { value: 'US', labelKey: 'americanAccent' },
    { value: 'UK', labelKey: 'britishAccent' },
    { value: 'AU', labelKey: 'australianAccent' }
  ],
  Arabic: [
    { value: 'Egyptian', labelKey: 'egyptianAccent' },
    { value: 'Levantine', labelKey: 'levantineAccent' },
    { value: 'Gulf', labelKey: 'gulfAccent' }
  ]
};

// Generation functions configuration
export const GENERATION_FUNCTIONS = {
  'generate-movie-info': {
    name: 'generate-movie-info',
    displayNameKey: 'generateMovieInfo',
    creditCost: 1,
    estimatedTime: '30s'
  },
  'edit-movie-info': {
    name: 'edit-movie-info', 
    displayNameKey: 'editMovieInfo',
    creditCost: 1,
    estimatedTime: '20s'
  },
  'validate-movie-info': {
    name: 'validate-movie-info',
    displayNameKey: 'validateMovieInfo',
    creditCost: 0.5,
    estimatedTime: '10s'
  },
  'generate-character-description': {
    name: 'generate-character-description',
    displayNameKey: 'generateCharacterDescription',
    creditCost: 1,
    estimatedTime: '25s'
  },
  'generate-character-portrait': {
    name: 'generate-character-portrait',
    displayNameKey: 'generateCharacterPortrait',
    creditCost: 2,
    estimatedTime: '45s'
  }
};

// Responsive breakpoints
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1280
} as const;

// Mobile-specific configuration
export const MOBILE_CONFIG = {
  maxSectionsOpen: 1, // Only allow one section open at a time on mobile
  autoCollapseOthers: true,
  useBottomSheet: true,
  touchTargetSize: 44, // Minimum touch target size in pixels
  swipeThreshold: 50 // Swipe distance threshold for gestures
};