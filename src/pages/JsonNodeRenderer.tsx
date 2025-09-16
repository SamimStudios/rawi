import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DynamicFieldRenderer } from '@/components/field-registry/DynamicFieldRenderer';
import { AlertCircle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Node structure interfaces
interface Node {
  id: string;
  job_id: string;
  node_type: string;
  path: string;
  parent_id?: string;
  content: string; // JSON string
  edit: string;
  actions: string;
  dependencies: string;
  removable: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  is_section: boolean;
}

interface I18nText {
  key?: string;
  fallback: string;
}

interface Item {
  ref: string;
  required?: boolean;
  rules?: Record<string, any>;
  repeatable?: {
    min?: number;
    max?: number;
    labelSingular?: string;
    labelPlural?: string;
  };
}

interface Subsection {
  id: string;
  label: I18nText;
  items: Item[];
}

interface Section {
  id: string;
  label: I18nText;
  items: Item[];
  subsections?: Subsection[];
}

interface NodeContent {
  version: string;
  sections: Section[];
}

interface FieldRegistry {
  id: string;
  field_id: string;
  datatype: string;
  widget: string;
  options: any;
  rules: any;
  ui: any;
  default_value: any;
  resolvedOptions?: Array<{
    value: string;
    label: string;
    extras?: Record<string, any>;
  }>;
}

const defaultNodeJson = `{
  "id": "2041b303-a2ec-4f9b-bee2-cccd46fb8563",
  "job_id": "78bfbff5-3f75-446a-9cb2-814f27ebb80b",
  "node_type": "form",
  "path": "root.user_input",
  "parent_id": null,
  "content": "{\\"version\\": \\"v1-sections\\", \\"sections\\": [{\\"id\\": \\"plan\\", \\"items\\": [{\\"ref\\": \\"title\\", \\"required\\": true}, {\\"ref\\": \\"logline\\", \\"required\\": true}, {\\"ref\\": \\"genres\\", \\"rules\\": {\\"max\\": 3}, \\"required\\": true}], \\"label\\": {\\"key\\": \\"sections.plan\\", \\"fallback\\": \\"Plan\\"}}, {\\"id\\": \\"preferences\\", \\"items\\": [{\\"ref\\": \\"language\\", \\"required\\": true}, {\\"ref\\": \\"accent\\"}, {\\"ref\\": \\"size\\", \\"required\\": true}, {\\"ref\\": \\"template\\", \\"required\\": true}, {\\"ref\\": \\"consent\\"}], \\"label\\": {\\"key\\": \\"sections.preferences\\", \\"fallback\\": \\"Preferences\\"}}, {\\"id\\": \\"lead\\", \\"items\\": [{\\"ref\\": \\"character_name\\", \\"required\\": true}, {\\"ref\\": \\"character_gender\\", \\"required\\": true}, {\\"ref\\": \\"faceImage\\"}], \\"label\\": {\\"key\\": \\"sections.lead\\", \\"fallback\\": \\"Lead\\"}, \\"subsections\\": [{\\"id\\": \\"appearance\\", \\"items\\": [{\\"ref\\": \\"age_range\\"}, {\\"ref\\": \\"ethnicity\\"}, {\\"ref\\": \\"skin_tone\\"}, {\\"ref\\": \\"head\\"}, {\\"ref\\": \\"face\\"}, {\\"ref\\": \\"body\\"}, {\\"ref\\": \\"clothes\\"}, {\\"ref\\": \\"look\\"}, {\\"ref\\": \\"distinct_trait\\", \\"repeatable\\": {\\"max\\": 3, \\"min\\": 0}}], \\"label\\": {\\"key\\": \\"sections.lead.appearance\\", \\"fallback\\": \\"Appearance\\"}}, {\\"id\\": \\"persona\\", \\"items\\": [{\\"ref\\": \\"personality\\"}], \\"label\\": {\\"key\\": \\"sections.lead.persona\\", \\"fallback\\": \\"Persona\\"}}]}]}",
  "edit": "{}",
  "actions": "{}",
  "dependencies": "[]",
  "removable": true,
  "created_at": "2025-09-16 06:42:08.971583+00",
  "updated_at": "2025-09-16 07:28:12.494696+00",
  "version": 1,
  "is_section": true
}`;

// Component for rendering individual items
const ItemRenderer: React.FC<{
  item: Item;
  field?: FieldRegistry;
  value: any;
  onChange: (value: any) => void;
  formValues: Record<string, any>;
}> = ({ item, field, value, onChange, formValues }) => {
  if (!field) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Field "{item.ref}" not found in registry</AlertDescription>
      </Alert>
    );
  }

  // Merge item rules with field rules
  const mergedRules = { ...field.rules };
  if (item.required !== undefined) {
    mergedRules.required = item.required;
  }
  if (item.rules) {
    Object.assign(mergedRules, item.rules);
  }

  const mergedField = {
    ...field,
    rules: mergedRules
  };

  return (
    <div className="space-y-2">
      <DynamicFieldRenderer
        field={mergedField}
        value={value}
        onChange={onChange}
        formValues={formValues}
      />
      {item.repeatable && (
        <div className="text-xs text-muted-foreground">
          Repeatable: {item.repeatable.min || 0} - {item.repeatable.max || '∞'}
        </div>
      )}
    </div>
  );
};

// Component for rendering subsections
const SubsectionRenderer: React.FC<{
  subsection: Subsection;
  fieldRegistry: Record<string, FieldRegistry>;
  formValues: Record<string, any>;
  onFieldChange: (fieldId: string, value: any) => void;
}> = ({ subsection, fieldRegistry, formValues, onFieldChange }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-l-2 border-muted pl-4 ml-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="p-0 h-auto font-medium text-sm flex items-center justify-start w-full">
            {isOpen ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
            {subsection.label.fallback}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-3">
          {subsection.items.map((item) => (
            <ItemRenderer
              key={item.ref}
              item={item}
              field={fieldRegistry[item.ref]}
              value={formValues[item.ref] || ''}
              onChange={(value) => onFieldChange(item.ref, value)}
              formValues={formValues}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// Component for rendering sections
const SectionRenderer: React.FC<{
  section: Section;
  fieldRegistry: Record<string, FieldRegistry>;
  formValues: Record<string, any>;
  onFieldChange: (fieldId: string, value: any) => void;
}> = ({ section, fieldRegistry, formValues, onFieldChange }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b border-border last:border-b-0 pb-6 last:pb-0">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="p-0 h-auto font-semibold text-lg flex items-center justify-between w-full hover:bg-transparent">
            <span>{section.label.fallback}</span>
            {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="space-y-6">
            {/* Render main section items */}
            {section.items.length > 0 && (
              <div className="space-y-4">
                {section.items.map((item) => (
                  <ItemRenderer
                    key={item.ref}
                    item={item}
                    field={fieldRegistry[item.ref]}
                    value={formValues[item.ref] || ''}
                    onChange={(value) => onFieldChange(item.ref, value)}
                    formValues={formValues}
                  />
                ))}
              </div>
            )}

            {/* Render subsections */}
            {section.subsections && section.subsections.length > 0 && (
              <div className="space-y-4">
                {section.subsections.map((subsection) => (
                  <SubsectionRenderer
                    key={subsection.id}
                    subsection={subsection}
                    fieldRegistry={fieldRegistry}
                    formValues={formValues}
                    onFieldChange={onFieldChange}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default function JsonNodeRenderer() {
  const [jsonInput, setJsonInput] = useState(defaultNodeJson);
  const [parsedNode, setParsedNode] = useState<Node | null>(null);
  const [nodeContent, setNodeContent] = useState<NodeContent | null>(null);
  const [fieldRegistry, setFieldRegistry] = useState<Record<string, FieldRegistry>>({});
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  // Fetch field registry
  const fetchFieldRegistry = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('field-registry-api');
      if (error) throw error;
      
      const registry: Record<string, FieldRegistry> = {};
      data.fields?.forEach((field: FieldRegistry) => {
        registry[field.field_id] = field;
      });
      setFieldRegistry(registry);
    } catch (err) {
      console.error('Failed to fetch field registry:', err);
      setError(`Failed to fetch field registry: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Parse node JSON
  const parseNodeJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      
      if (parsed.node_type !== 'form') {
        throw new Error('Node type must be "form"');
      }

      setParsedNode(parsed);
      
      // Parse content JSON
      const content = JSON.parse(parsed.content);
      if (content.version !== 'v1-sections') {
        throw new Error('Only v1-sections format is supported');
      }
      
      setNodeContent(content);
      setError('');
      
      // Initialize form values with default values
      const initialValues: Record<string, any> = {};
      content.sections?.forEach((section: Section) => {
        section.items?.forEach((item: Item) => {
          const field = fieldRegistry[item.ref];
          if (field?.default_value !== undefined) {
            initialValues[item.ref] = field.default_value;
          }
        });
        section.subsections?.forEach((subsection: Subsection) => {
          subsection.items?.forEach((item: Item) => {
            const field = fieldRegistry[item.ref];
            if (field?.default_value !== undefined) {
              initialValues[item.ref] = field.default_value;
            }
          });
        });
      });
      setFormValues(initialValues);
      
    } catch (err) {
      setError(`Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setParsedNode(null);
      setNodeContent(null);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleReset = () => {
    setJsonInput(defaultNodeJson);
    setParsedNode(null);
    setNodeContent(null);
    setFormValues({});
    setError('');
  };

  const handleParseAndRender = async () => {
    setLoading(true);
    await fetchFieldRegistry();
    parseNodeJson();
    setLoading(false);
  };

  // Parse on mount
  useEffect(() => {
    handleParseAndRender();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">JSON Node Renderer</h1>
        <p className="text-muted-foreground mt-2">
          Test complete node definitions with sections and field registry integration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* JSON Input */}
        <Card>
          <CardHeader>
            <CardTitle>Node Definition (JSON)</CardTitle>
            <CardDescription>
              Enter a complete node JSON with form content structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Enter node JSON..."
              className="min-h-[400px] font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleParseAndRender} className="flex-1" disabled={loading}>
                {loading ? 'Loading...' : 'Parse & Render'}
              </Button>
              <Button onClick={handleReset} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Node Info */}
        <Card>
          <CardHeader>
            <CardTitle>Node Information</CardTitle>
            <CardDescription>
              Basic node properties and structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parsedNode ? (
              <div className="space-y-3 text-sm">
                <div><strong>Node ID:</strong> {parsedNode.id}</div>
                <div><strong>Type:</strong> {parsedNode.node_type}</div>
                <div><strong>Path:</strong> {parsedNode.path}</div>
                <div><strong>Version:</strong> {parsedNode.version}</div>
                <div><strong>Sections:</strong> {nodeContent?.sections?.length || 0}</div>
                <div><strong>Total Fields:</strong> {
                  nodeContent?.sections?.reduce((total, section) => {
                    const sectionItems = section.items?.length || 0;
                    const subsectionItems = section.subsections?.reduce((subTotal, sub) => 
                      subTotal + (sub.items?.length || 0), 0) || 0;
                    return total + sectionItems + subsectionItems;
                  }, 0) || 0
                }</div>
                <div><strong>Registry Fields Loaded:</strong> {Object.keys(fieldRegistry).length}</div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {error ? 'Fix the JSON error to see node info' : 'Enter valid node JSON to see information'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rendered Node Form */}
      {nodeContent && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Node: {parsedNode?.path}</CardTitle>
              <CardDescription>Form with {nodeContent.sections.length} sections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {nodeContent.sections.map((section) => (
                <SectionRenderer
                  key={section.id}
                  section={section}
                  fieldRegistry={fieldRegistry}
                  formValues={formValues}
                  onFieldChange={handleFieldChange}
                />
              ))}
            </CardContent>
          </Card>

          {/* Form Values Debug */}
          <Card>
            <CardHeader>
              <CardTitle>Form Values (Debug)</CardTitle>
              <CardDescription>Current form state</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-40">
                {JSON.stringify(formValues, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sample Node Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Node Examples</CardTitle>
          <CardDescription>Click any example to load it</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: 'Simple Form Node',
                description: 'Basic form with one section',
                json: `{
  "id": "simple-form",
  "job_id": "job-123",
  "node_type": "form",
  "path": "root.simple",
  "content": "{\\"version\\": \\"v1-sections\\", \\"sections\\": [{\\"id\\": \\"basic\\", \\"label\\": {\\"fallback\\": \\"Basic Info\\"}, \\"items\\": [{\\"ref\\": \\"title\\", \\"required\\": true}, {\\"ref\\": \\"logline\\"}]}]}",
  "edit": "{}",
  "actions": "{}",
  "dependencies": "[]",
  "removable": true,
  "version": 1,
  "is_section": false
}`
              },
              {
                name: 'Complex Nested Form',
                description: 'Form with sections and subsections',
                json: defaultNodeJson
              }
            ].map((example) => (
              <Button
                key={example.name}
                variant="outline"
                className="h-auto p-4 text-left justify-start"
                onClick={() => setJsonInput(example.json)}
              >
                <div>
                  <div className="font-medium">{example.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {example.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}