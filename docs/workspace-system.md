# Systematic Workspace Configuration System

This document explains the new systematic, modular, and scalable workspace configuration system that centralizes all section definitions, button behaviors, and function mappings.

## Overview

The workspace system is built around a comprehensive configuration object that defines:
- **Sections**: What sections exist and their properties
- **Fields**: Input fields for each section with validation
- **Actions**: What buttons exist and what they do (edit, save, generate, validate, etc.)
- **Functions**: Which N8N functions to call and how
- **UI Configuration**: How sections should be displayed
- **Data Handling**: How to extract/save data from/to the job

## Key Files

### `/src/config/workspace-system.ts`
The main configuration file that defines everything about the workspace in a single place.

### `/src/hooks/useWorkspaceSystem.ts`  
A hook that implements the configuration system and provides actions to interact with it.

## Configuration Structure

### WorkspaceSectionConfig
Each section is defined by a comprehensive configuration object:

```typescript
{
  key: 'movie_info',
  titleKey: 'movieInformation', // Translation key
  icon: 'Film', // Lucide icon name
  order: 2, // Display order
  dependencies: ['user_input'], // Required sections
  affectedSections: ['characters', 'props'], // Sections affected by changes
  
  // Field definitions
  fields: [...],
  
  // Action definitions (what buttons do)
  actions: {
    generate: {
      enabled: true,
      labelKey: 'generateMovieInfo',
      functionId: 'generate-movie-info',
      creditCost: 1,
      estimatedTime: '30s',
      requiresData: ['user_input'],
      payload: (job) => ({ table_id: 'storyboard_jobs', row_id: job.id }),
      onSuccess: (result, updateSection) => { /* custom success handler */ }
    },
    save: { /* save action config */ },
    validate: { /* validate action config */ },
    edit: { /* edit action config */ },
    custom: { /* any custom actions */ }
  },
  
  // UI configuration
  ui: {
    collapsible: true,
    editMode: true,
    showValidationStatus: true,
    customComponent: 'MovieInfoSection'
  },
  
  // Data handling
  data: {
    extractFromJob: (job) => job.movie_info,
    saveToJob: (job, data) => ({ ...job, movie_info: data }),
    validate: (data) => ({ valid: true, errors: [] })
  }
}
```

## Action Types

### Standard Actions
- **edit**: Toggle edit mode
- **save**: Save changes to database
- **generate**: Generate new content via N8N
- **regenerate**: Regenerate existing content
- **validate**: Validate content via N8N
- **delete**: Delete content

### Custom Actions
Define any custom actions in the `actions.custom` object:

```typescript
custom: {
  'generate-lead-description': {
    enabled: true,
    labelKey: 'generateDescription',
    functionId: 'generate-character-description',
    creditCost: 1,
    payload: (job, sectionData) => ({ 
      table_id: 'storyboard_jobs', 
      row_id: job.id, 
      character_type: 'lead' 
    })
  }
}
```

## Usage in Components

### Using the Hook

```typescript
const { state, actions, config, getActionState } = useWorkspaceSystem(jobId);

// Execute actions
await actions.generate('movie_info');
await actions.save('characters');
await actions.customAction('characters', 'generate-lead-description');

// Check action state
const generateState = getActionState('movie_info', 'generate');
// Returns: { available: true, loading: false, creditCost: 1, estimatedTime: '30s' }

// Toggle edit mode
actions.toggleEditMode('movie_info');

// Update section data
actions.updateSectionData('movie_info', { title: 'New Title' });
```

### Rendering Sections

```typescript
// Get section configuration
const movieInfoConfig = getSectionConfig('movie_info');

// Render based on config
<WorkspaceSection
  config={movieInfoConfig}
  data={state.sectionData['movie_info']}
  isEditing={state.editMode['movie_info']}
  onExecuteAction={(actionKey, data) => actions.executeAction('movie_info', actionKey, data)}
  getActionState={(actionKey) => getActionState('movie_info', actionKey)}
/>
```

## Benefits

### 1. **Centralized Configuration**
- All section definitions in one place
- No scattered hardcoded strings or function IDs
- Single source of truth for workspace behavior

### 2. **Systematic Button Behavior**
- Every button's behavior is explicitly defined
- Credit costs and estimated times are centralized
- Consistent error handling and success feedback

### 3. **Scalable Architecture**
- Adding new sections requires only config changes
- Actions are reusable across sections
- Easy to add new action types

### 4. **Modular Design**
- Each section can have custom components
- Actions can be N8N functions or custom logic
- Validation rules are configurable per field

### 5. **Type Safety**
- Full TypeScript support
- Compile-time checking for configuration errors
- IntelliSense support for all configuration options

## Adding New Sections

To add a new section:

1. **Add to configuration**:
```typescript
{
  key: 'new_section',
  titleKey: 'newSectionTitle',
  icon: 'Star',
  order: 10,
  fields: [...],
  actions: {...},
  ui: {...},
  data: {...}
}
```

2. **Create custom component** (if needed):
```typescript
// src/components/workspace/sections/NewSection.tsx
export function NewSection({ data, onUpdate, ... }) {
  // Custom rendering logic
}
```

3. **Use in workspace**:
The new section will automatically appear in the workspace based on its `order` property.

## Migration from Legacy

The old workspace implementations can be gradually migrated to use this system:

1. **Extract section definitions** from components to configuration
2. **Replace hardcoded function IDs** with configuration references  
3. **Consolidate action handlers** using the systematic approach
4. **Update components** to use the configuration-driven approach

This creates a much more maintainable and scalable workspace system.