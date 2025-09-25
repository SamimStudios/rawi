import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Code2 } from 'lucide-react';

interface PayloadEditorProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  allowAllTypes?: boolean;
}

export function PayloadEditor({ label, value, onChange, placeholder, allowAllTypes = false }: PayloadEditorProps) {
  const [textValue, setTextValue] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [valueType, setValueType] = useState<string>('unknown');

  useEffect(() => {
    // Initialize text value
    if (value === null || value === undefined) {
      setTextValue('');
    } else if (typeof value === 'string') {
      setTextValue(value);
    } else {
      setTextValue(JSON.stringify(value, null, 2));
    }
  }, [value]);

  const parseValue = (input: string): any => {
    const trimmed = input.trim();
    
    // Empty string
    if (trimmed === '') return null;
    
    // Try to parse as JSON first (for objects and arrays)
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return JSON.parse(trimmed);
      } catch {
        // If JSON parsing fails, treat as string if allowAllTypes is true
        if (allowAllTypes) return trimmed;
        throw new Error('Invalid JSON syntax');
      }
    }
    
    if (allowAllTypes) {
      // Check for boolean
      if (trimmed.toLowerCase() === 'true') return true;
      if (trimmed.toLowerCase() === 'false') return false;
      
      // Check for number
      if (!isNaN(Number(trimmed)) && trimmed !== '') {
        return Number(trimmed);
      }
      
      // Default to string
      return trimmed;
    } else {
      // JSON-only mode - try to parse as JSON
      return JSON.parse(trimmed);
    }
  };

  const getValueType = (val: any): string => {
    if (val === null || val === undefined) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val;
  };

  const validateAndUpdate = (text: string) => {
    setTextValue(text);
    
    if (text.trim() === '') {
      setIsValid(true);
      setError('');
      setValueType('null');
      onChange(null);
      return;
    }

    try {
      const parsed = parseValue(text);
      setIsValid(true);
      setError('');
      setValueType(getValueType(parsed));
      onChange(parsed);
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : 'Invalid format');
      setValueType('invalid');
    }
  };

  const formatJSON = () => {
    if (textValue.trim() === '') return;
    
    try {
      const parsed = JSON.parse(textValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setTextValue(formatted);
    } catch (err) {
      // JSON is invalid, don't format
    }
  };

  const clearPayload = () => {
    setTextValue('');
    setIsValid(true);
    setError('');
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          {textValue.trim() !== '' && (
            <Badge variant={isValid ? "default" : "destructive"} className="text-xs">
              {isValid ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {allowAllTypes ? `Valid ${valueType}` : 'Valid JSON'}
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {allowAllTypes ? 'Invalid format' : 'Invalid JSON'}
                </>
              )}
            </Badge>
          )}
          
          <div className="flex gap-1">
            <Button
              onClick={formatJSON}
              variant="ghost"
              size="sm"
              disabled={!isValid || textValue.trim() === ''}
            >
              <Code2 className="w-3 h-3" />
            </Button>
            
            <Button
              onClick={clearPayload}
              variant="ghost"
              size="sm"
              disabled={textValue.trim() === ''}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      <Textarea
        value={textValue}
        onChange={(e) => validateAndUpdate(e.target.value)}
        placeholder={placeholder || (allowAllTypes ? 
          `Supports multiple types:\nString: Hello World\nNumber: 42\nBoolean: true\nJSON: {"key": "value"}\nArray: [1, 2, 3]` :
          `{\n  "key": "value"\n}`
        )}
        rows={8}
        className={`font-mono text-sm ${!isValid ? 'border-destructive' : ''}`}
      />

      {!isValid && error && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">JSON Syntax Error</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <p>
          {allowAllTypes ? 
            'Enter any value type - strings, numbers, booleans, JSON objects, or arrays. Leave empty if no payload is required.' :
            'Enter a valid JSON object that will be sent to the N8N function. Leave empty if no payload is required.'
          }
        </p>
      </div>
    </div>
  );
}