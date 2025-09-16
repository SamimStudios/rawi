import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DynamicFieldRenderer } from '@/components/field-registry/DynamicFieldRenderer';
import { AlertCircle, RefreshCw } from 'lucide-react';

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

const defaultJson = `{
  "field_id": "sample_field",
  "datatype": "string",
  "widget": "text",
  "ui": {
    "label": { "fallback": "Sample Field" },
    "placeholder": { "fallback": "Enter text here..." }
  },
  "rules": {
    "required": true,
    "minLength": 3
  }
}`;

export default function JsonNodeRenderer() {
  const [jsonInput, setJsonInput] = useState(defaultJson);
  const [parsedField, setParsedField] = useState<FieldRegistry | null>(null);
  const [error, setError] = useState<string>('');
  const [fieldValue, setFieldValue] = useState<any>('');
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const handleParseJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      // Add a generated ID if missing
      if (!parsed.id) {
        parsed.id = `generated_${Date.now()}`;
      }
      setParsedField(parsed);
      setError('');
      // Set default value if provided
      if (parsed.default_value !== undefined) {
        setFieldValue(parsed.default_value);
        setFormValues({ [parsed.field_id]: parsed.default_value });
      } else {
        setFieldValue('');
        setFormValues({ [parsed.field_id]: '' });
      }
    } catch (err) {
      setError(`Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setParsedField(null);
    }
  };

  const handleFieldChange = (value: any) => {
    setFieldValue(value);
    if (parsedField) {
      setFormValues({ [parsedField.field_id]: value });
    }
  };

  const handleReset = () => {
    setJsonInput(defaultJson);
    setParsedField(null);
    setFieldValue('');
    setFormValues({});
    setError('');
  };

  // Parse JSON on mount
  React.useEffect(() => {
    handleParseJson();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">JSON Node Renderer</h1>
        <p className="text-muted-foreground mt-2">
          Test field definitions by pasting JSON and seeing them rendered in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* JSON Input */}
        <Card>
          <CardHeader>
            <CardTitle>Field Definition (JSON)</CardTitle>
            <CardDescription>
              Enter a field registry JSON definition to see it rendered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Enter field JSON..."
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleParseJson} className="flex-1">
                Parse & Render
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

        {/* Rendered Field */}
        <Card>
          <CardHeader>
            <CardTitle>Rendered Field</CardTitle>
            <CardDescription>
              Live preview of your field definition
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parsedField ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <DynamicFieldRenderer
                    field={parsedField}
                    value={fieldValue}
                    onChange={handleFieldChange}
                    formValues={formValues}
                  />
                </div>
                
                {/* Field Info */}
                <div className="text-sm text-muted-foreground space-y-2">
                  <div><strong>Field ID:</strong> {parsedField.field_id}</div>
                  <div><strong>Widget:</strong> {parsedField.widget}</div>
                  <div><strong>Datatype:</strong> {parsedField.datatype}</div>
                  <div><strong>Current Value:</strong> {JSON.stringify(fieldValue)}</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {error ? 'Fix the JSON error to see the rendered field' : 'Enter valid JSON to see the rendered field'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sample JSON Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Sample JSON Examples</CardTitle>
          <CardDescription>Click any example to load it</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'Select with Options',
                json: `{
  "field_id": "country",
  "datatype": "string",
  "widget": "select",
  "ui": {
    "label": { "fallback": "Country" },
    "placeholder": { "fallback": "Select country..." }
  },
  "options": {
    "source": "static",
    "values": [
      { "value": "us", "label": "United States" },
      { "value": "uk", "label": "United Kingdom" },
      { "value": "ca", "label": "Canada" }
    ]
  },
  "rules": { "required": true }
}`
              },
              {
                name: 'Tags with Validation',
                json: `{
  "field_id": "skills",
  "datatype": "array",
  "widget": "tags",
  "ui": {
    "label": { "fallback": "Skills" },
    "placeholder": { "fallback": "Add skills..." }
  },
  "rules": {
    "minItems": 1,
    "maxItems": 5
  }
}`
              },
              {
                name: 'Textarea with Counter',
                json: `{
  "field_id": "description",
  "datatype": "string",
  "widget": "textarea",
  "ui": {
    "label": { "fallback": "Description" },
    "placeholder": { "fallback": "Enter description..." }
  },
  "rules": {
    "required": true,
    "maxLength": 500
  }
}`
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
                    Click to load this example
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