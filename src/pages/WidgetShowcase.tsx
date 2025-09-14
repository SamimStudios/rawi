import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DynamicFieldRenderer } from '@/components/field-registry/DynamicFieldRenderer';
import { Eye, Code2, Settings } from 'lucide-react';

// Comprehensive dummy data for all widget types and variations
const widgetShowcaseData = {
  text: [
    {
      id: '1',
      field_id: 'basic_text',
      datatype: 'string',
      widget: 'text',
      options: {},
      rules: {},
      ui: {
        label: { fallback: 'Basic Text Input', key: null },
        placeholder: { fallback: 'Enter some text...', key: null }
      },
      default_value: null,
      resolvedOptions: []
    },
    {
      id: '2',
      field_id: 'required_text',
      datatype: 'string',
      widget: 'text',
      options: {},
      rules: { required: true, minLength: 3, maxLength: 50 },
      ui: {
        label: { fallback: 'Required Text (3-50 chars)', key: null },
        placeholder: { fallback: 'Minimum 3 characters required', key: null },
        help: { fallback: 'This field is required and must be between 3-50 characters', key: null }
      },
      default_value: null,
      resolvedOptions: []
    },
    {
      id: '3',
      field_id: 'email_text',
      datatype: 'string',
      widget: 'text',
      options: {},
      rules: { required: true, format: 'email' },
      ui: {
        label: { fallback: 'Email Address', key: null },
        placeholder: { fallback: 'user@example.com', key: null }
      },
      default_value: null,
      resolvedOptions: []
    },
    {
      id: '4',
      field_id: 'phone_text',
      datatype: 'string',
      widget: 'text',
      options: {},
      rules: { pattern: '^\\+?[1-9]\\d{1,14}$' },
      ui: {
        label: { fallback: 'Phone Number', key: null },
        placeholder: { fallback: '+1234567890', key: null }
      },
      default_value: '+971',
      resolvedOptions: []
    }
  ],
  textarea: [
    {
      id: '5',
      field_id: 'basic_textarea',
      datatype: 'string',
      widget: 'textarea',
      options: {},
      rules: {},
      ui: {
        label: { fallback: 'Basic Textarea', key: null },
        placeholder: { fallback: 'Enter multiple lines of text...', key: null }
      },
      default_value: null,
      resolvedOptions: []
    },
    {
      id: '6',
      field_id: 'limited_textarea',
      datatype: 'string',
      widget: 'textarea',
      options: {},
      rules: { maxLength: 500, minLength: 10 },
      ui: {
        label: { fallback: 'Limited Textarea (10-500 chars)', key: null },
        placeholder: { fallback: 'Write your story here...', key: null },
        help: { fallback: 'Character count will be displayed', key: null }
      },
      default_value: 'This is a pre-filled textarea with some default content to demonstrate how default values work.',
      resolvedOptions: []
    }
  ],
  number: [
    {
      id: '7',
      field_id: 'basic_number',
      datatype: 'number',
      widget: 'number',
      options: {},
      rules: {},
      ui: {
        label: { fallback: 'Basic Number', key: null },
        placeholder: { fallback: '0', key: null }
      },
      default_value: null,
      resolvedOptions: []
    },
    {
      id: '8',
      field_id: 'age_number',
      datatype: 'number',
      widget: 'number',
      options: {},
      rules: { minimum: 18, maximum: 120, required: true },
      ui: {
        label: { fallback: 'Age (18-120)', key: null },
        placeholder: { fallback: 'Enter your age', key: null }
      },
      default_value: 25,
      resolvedOptions: []
    },
    {
      id: '9',
      field_id: 'price_number',
      datatype: 'number',
      widget: 'number',
      options: {},
      rules: { minimum: 0, maximum: 999999.99 },
      ui: {
        label: { fallback: 'Price (AED)', key: null },
        placeholder: { fallback: '0.00', key: null }
      },
      default_value: 100,
      resolvedOptions: []
    }
  ],
  checkbox: [
    {
      id: '10',
      field_id: 'boolean_checkbox',
      datatype: 'boolean',
      widget: 'checkbox',
      options: {},
      rules: {},
      ui: {
        label: { fallback: 'Accept Terms & Conditions', key: null }
      },
      default_value: false,
      resolvedOptions: []
    },
    {
      id: '11',
      field_id: 'required_checkbox',
      datatype: 'boolean',
      widget: 'checkbox',
      options: {},
      rules: { required: true },
      ui: {
        label: { fallback: 'I agree to receive newsletters', key: null },
        help: { fallback: 'This is required to continue', key: null }
      },
      default_value: null,
      resolvedOptions: []
    },
    {
      id: '12',
      field_id: 'multi_checkbox',
      datatype: 'array',
      widget: 'checkbox',
      options: {
        source: 'static',
        values: [
          { value: 'red', label: { fallback: 'Red Color', key: null }, extras: { hex: '#FF0000' } },
          { value: 'green', label: { fallback: 'Green Color', key: null }, extras: { hex: '#00FF00' } },
          { value: 'blue', label: { fallback: 'Blue Color', key: null }, extras: { hex: '#0000FF' } },
          { value: 'yellow', label: { fallback: 'Yellow Color', key: null }, extras: { hex: '#FFFF00' } }
        ]
      },
      rules: { minItems: 1, maxItems: 3 },
      ui: {
        label: { fallback: 'Favorite Colors (1-3)', key: null },
        help: { fallback: 'Select 1 to 3 colors you like', key: null }
      },
      default_value: ['red'],
      resolvedOptions: [
        { value: 'red', label: { fallback: 'Red Color', key: null }, extras: { hex: '#FF0000' } },
        { value: 'green', label: { fallback: 'Green Color', key: null }, extras: { hex: '#00FF00' } },
        { value: 'blue', label: { fallback: 'Blue Color', key: null }, extras: { hex: '#0000FF' } },
        { value: 'yellow', label: { fallback: 'Yellow Color', key: null }, extras: { hex: '#FFFF00' } }
      ]
    }
  ],
  radio: [
    {
      id: '13',
      field_id: 'gender_radio',
      datatype: 'string',
      widget: 'radio',
      options: {
        source: 'static',
        values: [
          { value: 'male', label: { fallback: 'Male', key: null } },
          { value: 'female', label: { fallback: 'Female', key: null } },
          { value: 'other', label: { fallback: 'Other', key: null } }
        ]
      },
      rules: { required: true },
      ui: {
        label: { fallback: 'Gender', key: null }
      },
      default_value: null,
      resolvedOptions: [
        { value: 'male', label: { fallback: 'Male', key: null } },
        { value: 'female', label: { fallback: 'Female', key: null } },
        { value: 'other', label: { fallback: 'Other', key: null } }
      ]
    },
    {
      id: '14',
      field_id: 'priority_radio',
      datatype: 'string',
      widget: 'radio',
      options: {
        source: 'static',
        values: [
          { value: 'low', label: { fallback: 'Low Priority', key: null }, extras: { color: '#10B981', description: 'Can wait until later' } },
          { value: 'medium', label: { fallback: 'Medium Priority', key: null }, extras: { color: '#F59E0B', description: 'Should be done soon' } },
          { value: 'high', label: { fallback: 'High Priority', key: null }, extras: { color: '#EF4444', description: 'Urgent - needs immediate attention' } },
          { value: 'critical', label: { fallback: 'Critical', key: null }, extras: { color: '#991B1B', description: 'Emergency - drop everything else' } }
        ]
      },
      rules: {},
      ui: {
        label: { fallback: 'Task Priority', key: null },
        help: { fallback: 'Choose the urgency level for this task', key: null }
      },
      default_value: 'medium',
      resolvedOptions: [
        { value: 'low', label: { fallback: 'Low Priority', key: null }, extras: { color: '#10B981', description: 'Can wait until later' } },
        { value: 'medium', label: { fallback: 'Medium Priority', key: null }, extras: { color: '#F59E0B', description: 'Should be done soon' } },
        { value: 'high', label: { fallback: 'High Priority', key: null }, extras: { color: '#EF4444', description: 'Urgent - needs immediate attention' } },
        { value: 'critical', label: { fallback: 'Critical', key: null }, extras: { color: '#991B1B', description: 'Emergency - drop everything else' } }
      ]
    }
  ],
  select: [
    {
      id: '15',
      field_id: 'country_select',
      datatype: 'string',
      widget: 'select',
      options: {
        source: 'static',
        values: [
          { value: 'ae', label: { fallback: 'United Arab Emirates', key: null }, extras: { code: 'AE', flag: '🇦🇪' } },
          { value: 'sa', label: { fallback: 'Saudi Arabia', key: null }, extras: { code: 'SA', flag: '🇸🇦' } },
          { value: 'us', label: { fallback: 'United States', key: null }, extras: { code: 'US', flag: '🇺🇸' } },
          { value: 'uk', label: { fallback: 'United Kingdom', key: null }, extras: { code: 'UK', flag: '🇬🇧' } },
          { value: 'ca', label: { fallback: 'Canada', key: null }, extras: { code: 'CA', flag: '🇨🇦' } }
        ]
      },
      rules: { required: true },
      ui: {
        label: { fallback: 'Country', key: null },
        placeholder: { fallback: 'Select your country', key: null }
      },
      default_value: 'ae',
      resolvedOptions: [
        { value: 'ae', label: { fallback: 'United Arab Emirates', key: null }, extras: { code: 'AE', flag: '🇦🇪' } },
        { value: 'sa', label: { fallback: 'Saudi Arabia', key: null }, extras: { code: 'SA', flag: '🇸🇦' } },
        { value: 'us', label: { fallback: 'United States', key: null }, extras: { code: 'US', flag: '🇺🇸' } },
        { value: 'uk', label: { fallback: 'United Kingdom', key: null }, extras: { code: 'UK', flag: '🇬🇧' } },
        { value: 'ca', label: { fallback: 'Canada', key: null }, extras: { code: 'CA', flag: '🇨🇦' } }
      ]
    },
    {
      id: '16',
      field_id: 'large_select',
      datatype: 'string',
      widget: 'select',
      options: {
        source: 'static',
        values: Array.from({ length: 20 }, (_, i) => ({
          value: `option_${i + 1}`,
          label: { fallback: `Option ${i + 1}`, key: null },
          extras: { index: i + 1, description: `This is option number ${i + 1}` }
        }))
      },
      rules: {},
      ui: {
        label: { fallback: 'Large Select (20+ options)', key: null },
        placeholder: { fallback: 'Search or select an option...', key: null },
        help: { fallback: 'This should be searchable due to many options', key: null }
      },
      default_value: null,
      resolvedOptions: Array.from({ length: 20 }, (_, i) => ({
        value: `option_${i + 1}`,
        label: { fallback: `Option ${i + 1}`, key: null },
        extras: { index: i + 1, description: `This is option number ${i + 1}` }
      }))
    },
    {
      id: '17',
      field_id: 'dependent_select',
      datatype: 'string',
      widget: 'select',
      options: {
        source: 'static',
        values: [
          { 
            value: 'dubai', 
            label: { fallback: 'Dubai', key: null }, 
            dependsOn: [{ field: 'country_select', allow: ['ae'] }],
            extras: { emirate: 'Dubai', country: 'UAE' }
          },
          { 
            value: 'abu_dhabi', 
            label: { fallback: 'Abu Dhabi', key: null }, 
            dependsOn: [{ field: 'country_select', allow: ['ae'] }],
            extras: { emirate: 'Abu Dhabi', country: 'UAE' }
          },
          { 
            value: 'riyadh', 
            label: { fallback: 'Riyadh', key: null }, 
            dependsOn: [{ field: 'country_select', allow: ['sa'] }],
            extras: { province: 'Riyadh Province', country: 'Saudi Arabia' }
          },
          { 
            value: 'jeddah', 
            label: { fallback: 'Jeddah', key: null }, 
            dependsOn: [{ field: 'country_select', allow: ['sa'] }],
            extras: { province: 'Makkah Province', country: 'Saudi Arabia' }
          }
        ]
      },
      rules: {},
      ui: {
        label: { fallback: 'City (depends on country)', key: null },
        placeholder: { fallback: 'Select a city...', key: null },
        help: { fallback: 'Options change based on selected country', key: null }
      },
      default_value: null,
      resolvedOptions: [
        { 
          value: 'dubai', 
          label: { fallback: 'Dubai', key: null }, 
          dependsOn: [{ field: 'country_select', allow: ['ae'] }],
          extras: { emirate: 'Dubai', country: 'UAE' }
        },
        { 
          value: 'abu_dhabi', 
          label: { fallback: 'Abu Dhabi', key: null }, 
          dependsOn: [{ field: 'country_select', allow: ['ae'] }],
          extras: { emirate: 'Abu Dhabi', country: 'UAE' }
        },
        { 
          value: 'riyadh', 
          label: { fallback: 'Riyadh', key: null }, 
          dependsOn: [{ field: 'country_select', allow: ['sa'] }],
          extras: { province: 'Riyadh Province', country: 'Saudi Arabia' }
        },
        { 
          value: 'jeddah', 
          label: { fallback: 'Jeddah', key: null }, 
          dependsOn: [{ field: 'country_select', allow: ['sa'] }],
          extras: { province: 'Makkah Province', country: 'Saudi Arabia' }
        }
      ]
    }
  ],
  tags: [
    {
      id: '18',
      field_id: 'skills_tags',
      datatype: 'array',
      widget: 'tags',
      options: {
        source: 'static',
        values: [
          { value: 'javascript', label: { fallback: 'JavaScript', key: null }, extras: { category: 'programming', level: 'frontend' } },
          { value: 'react', label: { fallback: 'React', key: null }, extras: { category: 'framework', level: 'frontend' } },
          { value: 'nodejs', label: { fallback: 'Node.js', key: null }, extras: { category: 'runtime', level: 'backend' } },
          { value: 'python', label: { fallback: 'Python', key: null }, extras: { category: 'programming', level: 'backend' } },
          { value: 'typescript', label: { fallback: 'TypeScript', key: null }, extras: { category: 'programming', level: 'fullstack' } },
          { value: 'css', label: { fallback: 'CSS', key: null }, extras: { category: 'styling', level: 'frontend' } },
          { value: 'html', label: { fallback: 'HTML', key: null }, extras: { category: 'markup', level: 'frontend' } },
          { value: 'sql', label: { fallback: 'SQL', key: null }, extras: { category: 'database', level: 'backend' } }
        ]
      },
      rules: { minItems: 1, maxItems: 5, uniqueItems: true },
      ui: {
        label: { fallback: 'Technical Skills (1-5)', key: null },
        help: { fallback: 'Select your technical skills from the available options', key: null }
      },
      default_value: ['javascript', 'react'],
      resolvedOptions: [
        { value: 'javascript', label: { fallback: 'JavaScript', key: null }, extras: { category: 'programming', level: 'frontend' } },
        { value: 'react', label: { fallback: 'React', key: null }, extras: { category: 'framework', level: 'frontend' } },
        { value: 'nodejs', label: { fallback: 'Node.js', key: null }, extras: { category: 'runtime', level: 'backend' } },
        { value: 'python', label: { fallback: 'Python', key: null }, extras: { category: 'programming', level: 'backend' } },
        { value: 'typescript', label: { fallback: 'TypeScript', key: null }, extras: { category: 'programming', level: 'fullstack' } },
        { value: 'css', label: { fallback: 'CSS', key: null }, extras: { category: 'styling', level: 'frontend' } },
        { value: 'html', label: { fallback: 'HTML', key: null }, extras: { category: 'markup', level: 'frontend' } },
        { value: 'sql', label: { fallback: 'SQL', key: null }, extras: { category: 'database', level: 'backend' } }
      ]
    },
    {
      id: '19',
      field_id: 'free_tags',
      datatype: 'array',
      widget: 'tags',
      options: {},
      rules: { maxItems: 10 },
      ui: {
        label: { fallback: 'Free-form Tags (max 10)', key: null },
        placeholder: { fallback: 'Type anything and press enter...', key: null },
        help: { fallback: 'You can type any tags you want', key: null }
      },
      default_value: ['sample', 'demo'],
      resolvedOptions: []
    }
  ],
  date: [
    {
      id: '20',
      field_id: 'birth_date',
      datatype: 'string',
      widget: 'date',
      options: {},
      rules: { required: true },
      ui: {
        label: { fallback: 'Date of Birth', key: null }
      },
      default_value: null,
      resolvedOptions: []
    },
    {
      id: '21',
      field_id: 'project_deadline',
      datatype: 'string',
      widget: 'date',
      options: {},
      rules: {},
      ui: {
        label: { fallback: 'Project Deadline', key: null },
        help: { fallback: 'When should this project be completed?', key: null }
      },
      default_value: '2024-12-31',
      resolvedOptions: []
    }
  ],
  datetime: [
    {
      id: '22',
      field_id: 'meeting_time',
      datatype: 'string',
      widget: 'datetime',
      options: {},
      rules: { required: true },
      ui: {
        label: { fallback: 'Meeting Date & Time', key: null },
        help: { fallback: 'Select the exact date and time for the meeting', key: null }
      },
      default_value: null,
      resolvedOptions: []
    },
    {
      id: '23',
      field_id: 'event_start',
      datatype: 'string',
      widget: 'datetime',
      options: {},
      rules: {},
      ui: {
        label: { fallback: 'Event Start Time', key: null }
      },
      default_value: '2024-01-01T09:00',
      resolvedOptions: []
    }
  ],
  url: [
    {
      id: '24',
      field_id: 'website_url',
      datatype: 'string',
      widget: 'url',
      options: {},
      rules: { format: 'url' },
      ui: {
        label: { fallback: 'Website URL', key: null },
        placeholder: { fallback: 'https://example.com', key: null }
      },
      default_value: null,
      resolvedOptions: []
    },
    {
      id: '25',
      field_id: 'portfolio_url',
      datatype: 'string',
      widget: 'url',
      options: {},
      rules: { required: true, format: 'url' },
      ui: {
        label: { fallback: 'Portfolio URL (Required)', key: null },
        placeholder: { fallback: 'https://your-portfolio.com', key: null },
        help: { fallback: 'Please provide a link to your online portfolio', key: null }
      },
      default_value: 'https://portfolio.example.com',
      resolvedOptions: []
    }
  ],
  color: [
    {
      id: '26',
      field_id: 'brand_color',
      datatype: 'string',
      widget: 'color',
      options: {},
      rules: {},
      ui: {
        label: { fallback: 'Brand Color', key: null },
        help: { fallback: 'Choose your brand primary color', key: null }
      },
      default_value: '#3B82F6',
      resolvedOptions: []
    },
    {
      id: '27',
      field_id: 'theme_color',
      datatype: 'string',
      widget: 'color',
      options: {},
      rules: { required: true, pattern: '^#[0-9A-Fa-f]{6}$' },
      ui: {
        label: { fallback: 'Theme Color (Required Hex)', key: null },
        placeholder: { fallback: '#000000', key: null }
      },
      default_value: null,
      resolvedOptions: []
    }
  ],
  file: [
    {
      id: '28',
      field_id: 'profile_image',
      datatype: 'string',
      widget: 'file',
      options: {
        accept: ['image/jpeg', 'image/png', 'image/gif'],
        maxSize: 5242880, // 5MB
        multiple: false
      },
      rules: {},
      ui: {
        label: { fallback: 'Profile Image', key: null },
        placeholder: { fallback: 'Upload your profile picture', key: null },
        help: { fallback: 'Accepted formats: JPG, PNG, GIF. Max size: 5MB', key: null }
      },
      default_value: null,
      resolvedOptions: []
    },
    {
      id: '29',
      field_id: 'document_files',
      datatype: 'array',
      widget: 'file',
      options: {
        accept: ['application/pdf', 'application/msword', 'text/plain'],
        maxSize: 10485760, // 10MB
        multiple: true
      },
      rules: { required: true, maxItems: 3 },
      ui: {
        label: { fallback: 'Required Documents (max 3)', key: null },
        placeholder: { fallback: 'Upload required documents', key: null },
        help: { fallback: 'PDF, DOC, TXT files only. Max 10MB each, up to 3 files', key: null }
      },
      default_value: null,
      resolvedOptions: []
    }
  ]
};

const WidgetShowcase: React.FC = () => {
  const [formValues, setFormValues] = useState<Record<string, any>>({
    // Pre-populate some values for demonstration
    country_select: 'ae',
    skills_tags: ['javascript', 'react'],
    priority_radio: 'medium',
    brand_color: '#3B82F6',
    birth_date: '1990-01-15',
    meeting_time: '2024-02-15T14:30',
    portfolio_url: 'https://portfolio.example.com',
    project_deadline: '2024-12-31',
    age_number: 25,
    price_number: 100,
    boolean_checkbox: true,
    multi_checkbox: ['red', 'blue'],
    free_tags: ['sample', 'demo', 'showcase'],
    limited_textarea: 'This is a pre-filled textarea with some default content to demonstrate how default values work in the system.',
    phone_text: '+971501234567'
  });

  const updateFieldValue = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const renderWidgetSection = (widgetType: string, fields: any[]) => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary" className="text-sm font-medium">
          {widgetType.toUpperCase()}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {fields.length} variant{fields.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <Card key={field.id} className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {field.field_id}
              </CardTitle>
              <CardDescription className="text-xs">
                Type: {field.datatype} | Widget: {field.widget}
                {field.rules && 'required' in field.rules && field.rules.required && (
                  <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Rendered Widget */}
              <div className="border rounded-lg p-3 bg-muted/30">
                <DynamicFieldRenderer
                  field={field}
                  value={formValues[field.field_id]}
                  onChange={(value) => updateFieldValue(field.field_id, value)}
                  formValues={formValues}
                />
              </div>
              
              {/* Current Value Display */}
              {formValues[field.field_id] !== undefined && formValues[field.field_id] !== null && (
                <div className="text-xs">
                  <strong>Value:</strong>{' '}
                  <code className="bg-muted px-1 rounded">
                    {JSON.stringify(formValues[field.field_id])}
                  </code>
                </div>
              )}
              
              {/* Configuration Details */}
              <Tabs defaultValue="rules" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-8">
                  <TabsTrigger value="rules" className="text-xs">Rules</TabsTrigger>
                  <TabsTrigger value="ui" className="text-xs">UI</TabsTrigger>
                  <TabsTrigger value="options" className="text-xs">Options</TabsTrigger>
                </TabsList>
                
                <TabsContent value="rules" className="mt-2">
                  <ScrollArea className="h-20 w-full">
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(field.rules, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="ui" className="mt-2">
                  <ScrollArea className="h-20 w-full">
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(field.ui, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="options" className="mt-2">
                  <ScrollArea className="h-20 w-full">
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(field.options, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
              
              {/* Special Features */}
              <div className="flex flex-wrap gap-1">
                {field.default_value && (
                  <Badge variant="outline" className="text-xs">Default Value</Badge>
                )}
                {field.resolvedOptions?.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {field.resolvedOptions.length} Options
                  </Badge>
                )}
                {field.resolvedOptions?.some(opt => opt.dependsOn) && (
                  <Badge variant="outline" className="text-xs">Dependent</Badge>
                )}
                {field.resolvedOptions?.some(opt => opt.extras && Object.keys(opt.extras).length > 0) && (
                  <Badge variant="outline" className="text-xs">Extra Data</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Widget Showcase</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Comprehensive demonstration of all widget types, properties, and their visual variations
        </p>
        <div className="flex items-center justify-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="text-sm">Live Interactive Examples</span>
          <Separator orientation="vertical" className="h-4" />
          <Code2 className="h-4 w-4" />
          <span className="text-sm">Configuration Details</span>
          <Separator orientation="vertical" className="h-4" />
          <Settings className="h-4 w-4" />
          <span className="text-sm">All Properties</span>
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {Object.keys(widgetShowcaseData).length}
              </div>
              <div className="text-sm text-muted-foreground">Widget Types</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {Object.values(widgetShowcaseData).flat().length}
              </div>
              <div className="text-sm text-muted-foreground">Total Variants</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {Object.values(widgetShowcaseData).flat().filter(f => f.resolvedOptions?.length > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">With Options</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {Object.values(widgetShowcaseData).flat().filter(f => f.rules && 'required' in f.rules && f.rules.required).length}
              </div>
              <div className="text-sm text-muted-foreground">Required Fields</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Widget Sections */}
      {Object.entries(widgetShowcaseData).map(([widgetType, fields]) => (
        <section key={widgetType}>
          <Separator className="mb-6" />
          {renderWidgetSection(widgetType, fields)}
        </section>
      ))}

      {/* Current Form State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Current Form State
          </CardTitle>
          <CardDescription>
            Live view of all form values as you interact with the widgets above
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full">
            <pre className="text-sm bg-muted p-4 rounded overflow-x-auto">
              {JSON.stringify(formValues, null, 2)}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default WidgetShowcase;