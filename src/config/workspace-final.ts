import { 
  User, 
  Film, 
  Users, 
  Package, 
  Clock, 
  Music,
  Play,
  Edit,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  Settings,
  Trash2,
  Copy,
  Download,
  Upload,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

// Visual System Types
export interface VisualFeedback {
  toast: {
    success: { title: string; description?: string; duration?: number };
    error: { title: string; description?: string; duration?: number };
    loading: { title: string; description?: string };
    info: { title: string; description?: string; duration?: number };
  };
  loading: {
    spinner: { size: 'sm' | 'default' | 'lg'; className?: string };
    skeleton: { type: 'card' | 'list' | 'table'; rows?: number };
    progress: { value?: number; className?: string };
  };
  validation: {
    success: { icon: typeof Check; color: string; message: string };
    error: { icon: typeof AlertCircle; color: string; message: string };
    warning: { icon: typeof AlertTriangle; color: string; message: string };
    pending: { icon: typeof Loader2; color: string; message: string };
  };
  confirmation: {
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    variant: 'default' | 'destructive';
  };
}

export interface IconConfig {
  section: typeof User;
  action: typeof Edit;
  state: typeof Check;
  expand: typeof ChevronDown;
  collapse: typeof ChevronUp;
  next: typeof ChevronRight;
  close: typeof X;
  help: typeof HelpCircle;
}

export interface WorkspaceFieldConfig {
  key: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'boolean' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: (value: any) => { valid: boolean; message?: string };
  options?: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
  description?: string;
  icon?: typeof User;
  visual?: {
    feedback: Partial<VisualFeedback>;
    loading: boolean;
  };
}

export interface WorkspaceActionConfig {
  key: string;
  label: string;
  icon: typeof Edit;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  functionId?: string;
  customAction?: (data: any) => Promise<any>;
  confirmation?: boolean;
  visual: {
    feedback: VisualFeedback;
    states: {
      idle: { icon: typeof Edit; className: string };
      loading: { icon: typeof Loader2; className: string };
      success: { icon: typeof Check; className: string };
      error: { icon: typeof AlertCircle; className: string };
    };
  };
  dependencies?: string[];
}

export interface WorkspaceSectionConfig {
  key: string;
  title: string;
  description?: string;
  icon: typeof User;
  order: number;
  fields: WorkspaceFieldConfig[];
  actions: WorkspaceActionConfig[];
  ui: {
    collapsible: boolean;
    defaultOpen: boolean;
    showProgress: boolean;
    showValidation: boolean;
    className?: string;
    layout: 'grid' | 'stack' | 'columns';
    columns?: number;
  };
  visual: {
    feedback: VisualFeedback;
    icons: IconConfig;
    states: {
      empty: { icon: typeof AlertCircle; color: string; message: string };
      loading: { icon: typeof Loader2; color: string; message: string };
      complete: { icon: typeof Check; color: string; message: string };
      error: { icon: typeof XCircle; color: string; message: string };
    };
  };
  data: {
    validation: (data: any) => { valid: boolean; errors: string[] };
    transform: (data: any) => any;
    dependencies?: string[];
  };
}

// Complete Visual System Configuration
export const VISUAL_SYSTEM = {
  icons: {
    sections: {
      user_input: User,
      movie_info: Film,
      characters: Users,
      props: Package,
      timeline: Clock,
      music: Music,
    },
    actions: {
      edit: Edit,
      save: Save,
      generate: Play,
      regenerate: RefreshCw,
      validate: Check,
      view: Eye,
      settings: Settings,
      delete: Trash2,
      copy: Copy,
      download: Download,
      upload: Upload,
      add: Plus,
      remove: Minus,
    },
    states: {
      success: CheckCircle,
      error: XCircle,
      warning: AlertTriangle,
      info: Info,
      loading: Loader2,
      pending: Clock,
    },
    navigation: {
      expand: ChevronDown,
      collapse: ChevronUp,
      next: ChevronRight,
      close: X,
      help: HelpCircle,
    },
  },
  feedback: {
    colors: {
      success: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      warning: 'hsl(var(--warning))',
      info: 'hsl(var(--info))',
      loading: 'hsl(var(--muted-foreground))',
    },
    animations: {
      fadeIn: 'animate-fade-in',
      fadeOut: 'animate-fade-out',
      scaleIn: 'animate-scale-in',
      slideIn: 'animate-slide-in-right',
      pulse: 'animate-pulse',
      spin: 'animate-spin',
    },
  },
  toast: {
    position: 'bottom-right' as const,
    duration: 4000,
    variants: {
      success: { className: 'border-success text-success-foreground' },
      error: { className: 'border-destructive text-destructive-foreground' },
      warning: { className: 'border-warning text-warning-foreground' },
      info: { className: 'border-info text-info-foreground' },
    },
  },
};

// Complete Workspace Configuration
export const WORKSPACE_FINAL_CONFIG: WorkspaceSectionConfig[] = [
  {
    key: 'user_input',
    title: 'User Input',
    description: 'Initial user requirements and preferences',
    icon: User,
    order: 1,
    fields: [
      {
        key: 'user_prompt',
        type: 'textarea',
        label: 'What story would you like to create?',
        placeholder: 'Describe your story idea, characters, setting, or any specific requirements...',
        required: true,
        validation: (value: string) => ({
          valid: value && value.length >= 10,
          message: value ? 'Minimum 10 characters required' : 'Story description is required'
        }),
        className: 'min-h-[120px]',
        description: 'Provide as much detail as possible to help generate your story',
        icon: Edit,
        visual: {
          feedback: {
            toast: {
              success: { title: 'Story saved', description: 'Your story idea has been saved' },
              error: { title: 'Failed to save', description: 'Please try again' },
              loading: { title: 'Saving story...' },
              info: { title: 'Auto-saved', description: 'Changes saved automatically' },
            },
            loading: {
              spinner: { size: 'sm', className: 'text-primary' },
              skeleton: { type: 'card' },
              progress: { className: 'h-2' },
            },
            validation: {
              success: { icon: Check, color: 'text-success', message: 'Story looks great!' },
              error: { icon: AlertCircle, color: 'text-destructive', message: 'Please provide more details' },
              warning: { icon: AlertTriangle, color: 'text-warning', message: 'Consider adding more context' },
              pending: { icon: Loader2, color: 'text-muted-foreground', message: 'Analyzing story...' },
            },
            confirmation: {
              title: 'Clear story?',
              description: 'This will remove all your story content. This action cannot be undone.',
              confirmText: 'Clear',
              cancelText: 'Cancel',
              variant: 'destructive',
            },
          },
          loading: false,
        },
      },
    ],
    actions: [
      {
        key: 'save',
        label: 'Save Story',
        icon: Save,
        variant: 'default',
        size: 'sm',
        functionId: 'save-user-input',
        visual: {
          feedback: {
            toast: {
              success: { title: 'Story saved', description: 'Your story has been saved successfully' },
              error: { title: 'Save failed', description: 'Failed to save your story. Please try again.' },
              loading: { title: 'Saving story...', description: 'Please wait while we save your changes' },
              info: { title: 'Auto-save enabled', description: 'Changes will be saved automatically' },
            },
            loading: {
              spinner: { size: 'sm' },
              skeleton: { type: 'card' },
              progress: {},
            },
            validation: {
              success: { icon: Check, color: 'text-success', message: 'Story saved successfully' },
              error: { icon: AlertCircle, color: 'text-destructive', message: 'Failed to save story' },
              warning: { icon: AlertTriangle, color: 'text-warning', message: 'Story may be incomplete' },
              pending: { icon: Loader2, color: 'text-muted-foreground', message: 'Saving...' },
            },
            confirmation: {
              title: 'Save changes?',
              description: 'This will overwrite the existing story content.',
              confirmText: 'Save',
              cancelText: 'Cancel',
              variant: 'default',
            },
          },
          states: {
            idle: { icon: Save, className: 'text-foreground' },
            loading: { icon: Loader2, className: 'animate-spin text-muted-foreground' },
            success: { icon: Check, className: 'text-success' },
            error: { icon: AlertCircle, className: 'text-destructive' },
          },
        },
        dependencies: ['user_prompt'],
      },
      {
        key: 'clear',
        label: 'Clear',
        icon: Trash2,
        variant: 'outline',
        size: 'sm',
        confirmation: true,
        customAction: async (data) => ({ ...data, user_prompt: '' }),
        visual: {
          feedback: {
            toast: {
              success: { title: 'Story cleared', description: 'Your story content has been cleared' },
              error: { title: 'Clear failed', description: 'Failed to clear story content' },
              loading: { title: 'Clearing story...' },
              info: { title: 'Story cleared', description: 'You can start fresh now' },
            },
            loading: {
              spinner: { size: 'sm' },
              skeleton: { type: 'card' },
              progress: {},
            },
            validation: {
              success: { icon: Check, color: 'text-success', message: 'Content cleared' },
              error: { icon: AlertCircle, color: 'text-destructive', message: 'Failed to clear' },
              warning: { icon: AlertTriangle, color: 'text-warning', message: 'This action cannot be undone' },
              pending: { icon: Loader2, color: 'text-muted-foreground', message: 'Clearing...' },
            },
            confirmation: {
              title: 'Clear all content?',
              description: 'This will permanently delete your story content. This action cannot be undone.',
              confirmText: 'Clear Content',
              cancelText: 'Keep Content',
              variant: 'destructive',
            },
          },
          states: {
            idle: { icon: Trash2, className: 'text-muted-foreground' },
            loading: { icon: Loader2, className: 'animate-spin text-muted-foreground' },
            success: { icon: Check, className: 'text-success' },
            error: { icon: AlertCircle, className: 'text-destructive' },
          },
        },
        dependencies: [],
      },
    ],
    ui: {
      collapsible: true,
      defaultOpen: true,
      showProgress: true,
      showValidation: true,
      className: 'border-l-4 border-l-primary',
      layout: 'stack',
    },
    visual: {
      feedback: {
        toast: {
          success: { title: 'Section updated', description: 'User input section has been updated' },
          error: { title: 'Update failed', description: 'Failed to update user input section' },
          loading: { title: 'Updating section...' },
          info: { title: 'Section info', description: 'This section contains your story requirements' },
        },
        loading: {
          spinner: { size: 'default' },
          skeleton: { type: 'card' },
          progress: {},
        },
        validation: {
          success: { icon: Check, color: 'text-success', message: 'Section complete' },
          error: { icon: AlertCircle, color: 'text-destructive', message: 'Section needs attention' },
          warning: { icon: AlertTriangle, color: 'text-warning', message: 'Section partially complete' },
          pending: { icon: Loader2, color: 'text-muted-foreground', message: 'Processing...' },
        },
        confirmation: {
          title: 'Reset section?',
          description: 'This will reset all fields in this section to their default values.',
          confirmText: 'Reset',
          cancelText: 'Cancel',
          variant: 'destructive',
        },
      },
      icons: {
        section: User,
        action: Edit,
        state: Check,
        expand: ChevronDown,
        collapse: ChevronUp,
        next: ChevronRight,
        close: X,
        help: HelpCircle,
      },
      states: {
        empty: { icon: AlertCircle, color: 'text-muted-foreground', message: 'No story provided yet' },
        loading: { icon: Loader2, color: 'text-primary', message: 'Processing your story...' },
        complete: { icon: Check, color: 'text-success', message: 'Story requirements captured' },
        error: { icon: XCircle, color: 'text-destructive', message: 'Failed to process story' },
      },
    },
    data: {
      validation: (data: any) => ({
        valid: data.user_prompt && data.user_prompt.length >= 10,
        errors: data.user_prompt 
          ? data.user_prompt.length < 10 ? ['Story description must be at least 10 characters'] : []
          : ['Story description is required'],
      }),
      transform: (data: any) => ({
        ...data,
        user_prompt: data.user_prompt?.trim() || '',
      }),
    },
  },
  {
    key: 'movie_info',
    title: 'Movie Information',
    description: 'Generated movie details and metadata',
    icon: Film,
    order: 2,
    fields: [
      {
        key: 'title',
        type: 'text',
        label: 'Movie Title',
        placeholder: 'Generated movie title will appear here...',
        required: true,
        disabled: true,
        className: 'font-semibold text-lg',
        icon: Film,
        visual: {
          feedback: {
            toast: {
              success: { title: 'Title generated', description: 'Movie title has been created' },
              error: { title: 'Generation failed', description: 'Failed to generate movie title' },
              loading: { title: 'Generating title...' },
              info: { title: 'Title ready', description: 'Your movie title is ready' },
            },
            loading: {
              spinner: { size: 'sm' },
              skeleton: { type: 'list' },
              progress: {},
            },
            validation: {
              success: { icon: Check, color: 'text-success', message: 'Great title!' },
              error: { icon: AlertCircle, color: 'text-destructive', message: 'Title needs work' },
              warning: { icon: AlertTriangle, color: 'text-warning', message: 'Consider refining title' },
              pending: { icon: Loader2, color: 'text-muted-foreground', message: 'Generating...' },
            },
            confirmation: {
              title: 'Regenerate title?',
              description: 'This will create a new movie title.',
              confirmText: 'Regenerate',
              cancelText: 'Keep Current',
              variant: 'default',
            },
          },
          loading: false,
        },
      },
      {
        key: 'genre',
        type: 'select',
        label: 'Genre',
        placeholder: 'Select or generate genre...',
        options: [
          { value: 'action', label: 'Action' },
          { value: 'comedy', label: 'Comedy' },
          { value: 'drama', label: 'Drama' },
          { value: 'horror', label: 'Horror' },
          { value: 'romance', label: 'Romance' },
          { value: 'sci-fi', label: 'Science Fiction' },
          { value: 'thriller', label: 'Thriller' },
        ],
        icon: Package,
        visual: {
          feedback: {
            toast: {
              success: { title: 'Genre set', description: 'Movie genre has been selected' },
              error: { title: 'Selection failed', description: 'Failed to set movie genre' },
              loading: { title: 'Setting genre...' },
              info: { title: 'Genre info', description: 'This affects the overall tone and style' },
            },
            loading: {
              spinner: { size: 'sm' },
              skeleton: { type: 'list' },
              progress: {},
            },
            validation: {
              success: { icon: Check, color: 'text-success', message: 'Genre selected' },
              error: { icon: AlertCircle, color: 'text-destructive', message: 'Please select a genre' },
              warning: { icon: AlertTriangle, color: 'text-warning', message: 'Genre affects story tone' },
              pending: { icon: Loader2, color: 'text-muted-foreground', message: 'Loading genres...' },
            },
            confirmation: {
              title: 'Change genre?',
              description: 'This may affect other generated content.',
              confirmText: 'Change',
              cancelText: 'Keep Current',
              variant: 'default',
            },
          },
          loading: false,
        },
      },
      {
        key: 'synopsis',
        type: 'textarea',
        label: 'Synopsis',
        placeholder: 'Generated synopsis will appear here...',
        disabled: true,
        className: 'min-h-[100px]',
        icon: Edit,
        visual: {
          feedback: {
            toast: {
              success: { title: 'Synopsis generated', description: 'Movie synopsis has been created' },
              error: { title: 'Generation failed', description: 'Failed to generate synopsis' },
              loading: { title: 'Generating synopsis...' },
              info: { title: 'Synopsis ready', description: 'Your movie synopsis is complete' },
            },
            loading: {
              spinner: { size: 'sm' },
              skeleton: { type: 'card' },
              progress: {},
            },
            validation: {
              success: { icon: Check, color: 'text-success', message: 'Compelling synopsis!' },
              error: { icon: AlertCircle, color: 'text-destructive', message: 'Synopsis needs improvement' },
              warning: { icon: AlertTriangle, color: 'text-warning', message: 'Consider expanding synopsis' },
              pending: { icon: Loader2, color: 'text-muted-foreground', message: 'Generating...' },
            },
            confirmation: {
              title: 'Regenerate synopsis?',
              description: 'This will create a new movie synopsis.',
              confirmText: 'Regenerate',
              cancelText: 'Keep Current',
              variant: 'default',
            },
          },
          loading: false,
        },
      },
    ],
    actions: [
      {
        key: 'generate',
        label: 'Generate Movie Info',
        icon: Play,
        variant: 'default',
        size: 'default',
        functionId: 'generate-movie-info',
        visual: {
          feedback: {
            toast: {
              success: { title: 'Movie info generated', description: 'Title, genre, and synopsis have been created' },
              error: { title: 'Generation failed', description: 'Failed to generate movie information' },
              loading: { title: 'Generating movie info...', description: 'This may take a few moments' },
              info: { title: 'Generation started', description: 'Creating your movie information' },
            },
            loading: {
              spinner: { size: 'default' },
              skeleton: { type: 'card' },
              progress: {},
            },
            validation: {
              success: { icon: Check, color: 'text-success', message: 'Movie info generated successfully' },
              error: { icon: AlertCircle, color: 'text-destructive', message: 'Generation failed' },
              warning: { icon: AlertTriangle, color: 'text-warning', message: 'Partial generation completed' },
              pending: { icon: Loader2, color: 'text-muted-foreground', message: 'Generating movie info...' },
            },
            confirmation: {
              title: 'Generate movie info?',
              description: 'This will create title, genre, and synopsis based on your story.',
              confirmText: 'Generate',
              cancelText: 'Cancel',
              variant: 'default',
            },
          },
          states: {
            idle: { icon: Play, className: 'text-foreground' },
            loading: { icon: Loader2, className: 'animate-spin text-primary' },
            success: { icon: Check, className: 'text-success' },
            error: { icon: AlertCircle, className: 'text-destructive' },
          },
        },
        dependencies: ['user_input'],
      },
      {
        key: 'regenerate',
        label: 'Regenerate',
        icon: RefreshCw,
        variant: 'outline',
        size: 'sm',
        functionId: 'generate-movie-info',
        confirmation: true,
        visual: {
          feedback: {
            toast: {
              success: { title: 'Movie info regenerated', description: 'New movie information has been created' },
              error: { title: 'Regeneration failed', description: 'Failed to regenerate movie information' },
              loading: { title: 'Regenerating...', description: 'Creating new movie information' },
              info: { title: 'Regeneration started', description: 'This will replace existing content' },
            },
            loading: {
              spinner: { size: 'sm' },
              skeleton: { type: 'card' },
              progress: {},
            },
            validation: {
              success: { icon: Check, color: 'text-success', message: 'Successfully regenerated' },
              error: { icon: AlertCircle, color: 'text-destructive', message: 'Regeneration failed' },
              warning: { icon: AlertTriangle, color: 'text-warning', message: 'This will replace existing content' },
              pending: { icon: Loader2, color: 'text-muted-foreground', message: 'Regenerating...' },
            },
            confirmation: {
              title: 'Regenerate movie info?',
              description: 'This will replace all existing movie information with new content.',
              confirmText: 'Regenerate',
              cancelText: 'Cancel',
              variant: 'default',
            },
          },
          states: {
            idle: { icon: RefreshCw, className: 'text-muted-foreground' },
            loading: { icon: Loader2, className: 'animate-spin text-primary' },
            success: { icon: Check, className: 'text-success' },
            error: { icon: AlertCircle, className: 'text-destructive' },
          },
        },
        dependencies: ['user_input'],
      },
    ],
    ui: {
      collapsible: true,
      defaultOpen: false,
      showProgress: true,
      showValidation: true,
      className: 'border-l-4 border-l-accent',
      layout: 'stack',
    },
    visual: {
      feedback: {
        toast: {
          success: { title: 'Movie info updated', description: 'Movie information section has been updated' },
          error: { title: 'Update failed', description: 'Failed to update movie information' },
          loading: { title: 'Updating movie info...' },
          info: { title: 'Movie info', description: 'This section contains generated movie details' },
        },
        loading: {
          spinner: { size: 'default' },
          skeleton: { type: 'card' },
          progress: {},
        },
        validation: {
          success: { icon: Check, color: 'text-success', message: 'Movie info complete' },
          error: { icon: AlertCircle, color: 'text-destructive', message: 'Movie info incomplete' },
          warning: { icon: AlertTriangle, color: 'text-warning', message: 'Some fields may need attention' },
          pending: { icon: Loader2, color: 'text-muted-foreground', message: 'Processing movie info...' },
        },
        confirmation: {
          title: 'Reset movie info?',
          description: 'This will clear all generated movie information.',
          confirmText: 'Reset',
          cancelText: 'Cancel',
          variant: 'destructive',
        },
      },
      icons: {
        section: Film,
        action: Play,
        state: Check,
        expand: ChevronDown,
        collapse: ChevronUp,
        next: ChevronRight,
        close: X,
        help: HelpCircle,
      },
      states: {
        empty: { icon: AlertCircle, color: 'text-muted-foreground', message: 'No movie info generated yet' },
        loading: { icon: Loader2, color: 'text-primary', message: 'Generating movie information...' },
        complete: { icon: Check, color: 'text-success', message: 'Movie information complete' },
        error: { icon: XCircle, color: 'text-destructive', message: 'Failed to generate movie info' },
      },
    },
    data: {
      validation: (data: any) => {
        const errors: string[] = [];
        if (!data.title) errors.push('Movie title is required');
        if (!data.genre) errors.push('Genre is required');
        if (!data.synopsis) errors.push('Synopsis is required');
        return { valid: errors.length === 0, errors };
      },
      transform: (data: any) => ({
        ...data,
        title: data.title?.trim() || '',
        genre: data.genre || '',
        synopsis: data.synopsis?.trim() || '',
      }),
      dependencies: ['user_input'],
    },
  },
  {
    key: 'characters',
    title: 'Characters',
    description: 'Story characters with descriptions and portraits',
    icon: Users,
    order: 3,
    fields: [
      {
        key: 'main_character',
        type: 'textarea',
        label: 'Main Character',
        placeholder: 'Main character description will be generated...',
        disabled: true,
        className: 'min-h-[80px]',
        icon: User,
        visual: {
          feedback: {
            toast: {
              success: { title: 'Character created', description: 'Main character has been generated' },
              error: { title: 'Generation failed', description: 'Failed to create main character' },
              loading: { title: 'Creating character...' },
              info: { title: 'Character ready', description: 'Main character description is complete' },
            },
            loading: {
              spinner: { size: 'sm' },
              skeleton: { type: 'card' },
              progress: {},
            },
            validation: {
              success: { icon: Check, color: 'text-success', message: 'Compelling character!' },
              error: { icon: AlertCircle, color: 'text-destructive', message: 'Character needs development' },
              warning: { icon: AlertTriangle, color: 'text-warning', message: 'Consider adding more details' },
              pending: { icon: Loader2, color: 'text-muted-foreground', message: 'Generating character...' },
            },
            confirmation: {
              title: 'Regenerate character?',
              description: 'This will create a new main character description.',
              confirmText: 'Regenerate',
              cancelText: 'Keep Current',
              variant: 'default',
            },
          },
          loading: false,
        },
      },
      {
        key: 'supporting_characters',
        type: 'textarea',
        label: 'Supporting Characters',
        placeholder: 'Supporting characters will be generated...',
        disabled: true,
        className: 'min-h-[80px]',
        icon: Users,
        visual: {
          feedback: {
            toast: {
              success: { title: 'Characters created', description: 'Supporting characters have been generated' },
              error: { title: 'Generation failed', description: 'Failed to create supporting characters' },
              loading: { title: 'Creating characters...' },
              info: { title: 'Characters ready', description: 'Supporting characters are complete' },
            },
            loading: {
              spinner: { size: 'sm' },
              skeleton: { type: 'card' },
              progress: {},
            },
            validation: {
              success: { icon: Check, color: 'text-success', message: 'Great character roster!' },
              error: { icon: AlertCircle, color: 'text-destructive', message: 'Characters need development' },
              warning: { icon: AlertTriangle, color: 'text-warning', message: 'Consider adding more variety' },
              pending: { icon: Loader2, color: 'text-muted-foreground', message: 'Generating characters...' },
            },
            confirmation: {
              title: 'Regenerate characters?',
              description: 'This will create new supporting character descriptions.',
              confirmText: 'Regenerate',
              cancelText: 'Keep Current',
              variant: 'default',
            },
          },
          loading: false,
        },
      },
    ],
    actions: [
      {
        key: 'generate',
        label: 'Generate Characters',
        icon: Users,
        variant: 'default',
        size: 'default',
        functionId: 'generate-characters',
        visual: {
          feedback: {
            toast: {
              success: { title: 'Characters generated', description: 'All characters have been created successfully' },
              error: { title: 'Generation failed', description: 'Failed to generate characters' },
              loading: { title: 'Generating characters...', description: 'Creating your story characters' },
              info: { title: 'Generation started', description: 'This may take a moment' },
            },
            loading: {
              spinner: { size: 'default' },
              skeleton: { type: 'card' },
              progress: {},
            },
            validation: {
              success: { icon: Check, color: 'text-success', message: 'Characters generated successfully' },
              error: { icon: AlertCircle, color: 'text-destructive', message: 'Character generation failed' },
              warning: { icon: AlertTriangle, color: 'text-warning', message: 'Partial generation completed' },
              pending: { icon: Loader2, color: 'text-muted-foreground', message: 'Generating characters...' },
            },
            confirmation: {
              title: 'Generate characters?',
              description: 'This will create character descriptions based on your story.',
              confirmText: 'Generate',
              cancelText: 'Cancel',
              variant: 'default',
            },
          },
          states: {
            idle: { icon: Users, className: 'text-foreground' },
            loading: { icon: Loader2, className: 'animate-spin text-primary' },
            success: { icon: Check, className: 'text-success' },
            error: { icon: AlertCircle, className: 'text-destructive' },
          },
        },
        dependencies: ['movie_info'],
      },
      {
        key: 'generate_portraits',
        label: 'Generate Portraits',
        icon: Eye,
        variant: 'outline',
        size: 'sm',
        functionId: 'generate-character-portraits',
        visual: {
          feedback: {
            toast: {
              success: { title: 'Portraits generated', description: 'Character portraits have been created' },
              error: { title: 'Portrait generation failed', description: 'Failed to generate character portraits' },
              loading: { title: 'Generating portraits...', description: 'Creating character images' },
              info: { title: 'Portrait generation started', description: 'This may take several minutes' },
            },
            loading: {
              spinner: { size: 'sm' },
              skeleton: { type: 'card' },
              progress: {},
            },
            validation: {
              success: { icon: Check, color: 'text-success', message: 'Portraits generated successfully' },
              error: { icon: AlertCircle, color: 'text-destructive', message: 'Portrait generation failed' },
              warning: { icon: AlertTriangle, color: 'text-warning', message: 'Some portraits may need regeneration' },
              pending: { icon: Loader2, color: 'text-muted-foreground', message: 'Generating portraits...' },
            },
            confirmation: {
              title: 'Generate character portraits?',
              description: 'This will create visual representations of your characters.',
              confirmText: 'Generate Portraits',
              cancelText: 'Cancel',
              variant: 'default',
            },
          },
          states: {
            idle: { icon: Eye, className: 'text-muted-foreground' },
            loading: { icon: Loader2, className: 'animate-spin text-primary' },
            success: { icon: Check, className: 'text-success' },
            error: { icon: AlertCircle, className: 'text-destructive' },
          },
        },
        dependencies: ['characters'],
      },
    ],
    ui: {
      collapsible: true,
      defaultOpen: false,
      showProgress: true,
      showValidation: true,
      className: 'border-l-4 border-l-secondary',
      layout: 'stack',
    },
    visual: {
      feedback: {
        toast: {
          success: { title: 'Characters updated', description: 'Character section has been updated' },
          error: { title: 'Update failed', description: 'Failed to update characters' },
          loading: { title: 'Updating characters...' },
          info: { title: 'Characters info', description: 'This section contains your story characters' },
        },
        loading: {
          spinner: { size: 'default' },
          skeleton: { type: 'card' },
          progress: {},
        },
        validation: {
          success: { icon: Check, color: 'text-success', message: 'Characters complete' },
          error: { icon: AlertCircle, color: 'text-destructive', message: 'Characters need attention' },
          warning: { icon: AlertTriangle, color: 'text-warning', message: 'Some characters may be incomplete' },
          pending: { icon: Loader2, color: 'text-muted-foreground', message: 'Processing characters...' },
        },
        confirmation: {
          title: 'Reset characters?',
          description: 'This will clear all character information.',
          confirmText: 'Reset',
          cancelText: 'Cancel',
          variant: 'destructive',
        },
      },
      icons: {
        section: Users,
        action: Users,
        state: Check,
        expand: ChevronDown,
        collapse: ChevronUp,
        next: ChevronRight,
        close: X,
        help: HelpCircle,
      },
      states: {
        empty: { icon: AlertCircle, color: 'text-muted-foreground', message: 'No characters generated yet' },
        loading: { icon: Loader2, color: 'text-primary', message: 'Generating characters...' },
        complete: { icon: Check, color: 'text-success', message: 'Characters complete' },
        error: { icon: XCircle, color: 'text-destructive', message: 'Failed to generate characters' },
      },
    },
    data: {
      validation: (data: any) => {
        const errors: string[] = [];
        if (!data.main_character) errors.push('Main character is required');
        if (!data.supporting_characters) errors.push('Supporting characters are required');
        return { valid: errors.length === 0, errors };
      },
      transform: (data: any) => ({
        ...data,
        main_character: data.main_character?.trim() || '',
        supporting_characters: data.supporting_characters?.trim() || '',
      }),
      dependencies: ['movie_info'],
    },
  },
];

// Helper Functions
export function getSectionConfig(key: string): WorkspaceSectionConfig | undefined {
  return WORKSPACE_FINAL_CONFIG.find(section => section.key === key);
}

export function getSectionsByOrder(): WorkspaceSectionConfig[] {
  return [...WORKSPACE_FINAL_CONFIG].sort((a, b) => a.order - b.order);
}

export function getAllFunctionIds(): string[] {
  const functionIds = new Set<string>();
  WORKSPACE_FINAL_CONFIG.forEach(section => {
    section.actions.forEach(action => {
      if (action.functionId) {
        functionIds.add(action.functionId);
      }
    });
  });
  return Array.from(functionIds);
}

export function getActionConfig(sectionKey: string, actionKey: string): WorkspaceActionConfig | undefined {
  const section = getSectionConfig(sectionKey);
  return section?.actions.find(action => action.key === actionKey);
}

export function validateSectionData(sectionKey: string, data: any): { valid: boolean; errors: string[] } {
  const section = getSectionConfig(sectionKey);
  if (!section) {
    return { valid: false, errors: ['Section not found'] };
  }
  
  return section.data.validation(data);
}

export function getVisualFeedback(type: 'success' | 'error' | 'warning' | 'info', context: string): any {
  return VISUAL_SYSTEM.feedback;
}

export function getIcon(category: keyof typeof VISUAL_SYSTEM.icons, key: string): any {
  return VISUAL_SYSTEM.icons[category]?.[key];
}

export function getToastConfig(variant: 'success' | 'error' | 'warning' | 'info'): any {
  return {
    ...VISUAL_SYSTEM.toast,
    ...VISUAL_SYSTEM.toast.variants[variant],
  };
}

// Export default configuration
export default WORKSPACE_FINAL_CONFIG;