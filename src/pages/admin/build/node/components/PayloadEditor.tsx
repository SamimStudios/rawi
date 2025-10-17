import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Code2 } from 'lucide-react';

interface PayloadEditorProps {
  label: string;
  value: Record<string, any> | null;
  onChange: (value: Record<string, any> | null) => void;
  placeholder?: string;
}

export function PayloadEditor({ label, value, onChange, placeholder }: PayloadEditorProps) {
  const [textValue, setTextValue] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Initialize text value from JSON
    if (value === null) {
      setTextValue('');
    } else {
      setTextValue(JSON.stringify(value, null, 2));
    }
  }, [value]);

  const validateAndUpdate = (text: string) => {
    setTextValue(text);
    
    if (text.trim() === '') {
      setIsValid(true);
      setError('');
      onChange(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      setIsValid(true);
      setError('');
      onChange(parsed);
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : 'Invalid JSON');
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
                  Valid JSON
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Invalid JSON
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
        placeholder={placeholder || `{\n  "key": "value"\n}`}
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
          Enter a valid JSON object that will be sent to the N8N function. 
          Leave empty if no payload is required.
        </p>
      </div>
    </div>
  );
}