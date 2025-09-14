import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';
import { useLanguage } from '@/contexts/LanguageContext';

interface FieldRegistry {
  id: string;
  field_id: string;
  datatype: string;
  widget: string;
  options: any;
  rules: any;
  ui: any;
  default_value: any;
  version: number;
  created_at: string;
  updated_at: string;
  resolvedOptions?: any[];
}

interface FieldCardProps {
  field: FieldRegistry;
  formValues?: Record<string, any>;
  onFieldChange?: (fieldId: string, value: any) => void;
}

export function FieldCard({ field, formValues = {}, onFieldChange }: FieldCardProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [testValue, setTestValue] = useState(field.default_value);

  const handleValueChange = (value: any) => {
    setTestValue(value);
    onFieldChange?.(field.field_id, value);
  };

  const getDataTypeBadgeColor = (datatype: string) => {
    const colors: Record<string, string> = {
      string: 'bg-blue-100 text-blue-800',
      number: 'bg-green-100 text-green-800',
      boolean: 'bg-yellow-100 text-yellow-800',
      array: 'bg-purple-100 text-purple-800',
      object: 'bg-orange-100 text-orange-800',
      uuid: 'bg-gray-100 text-gray-800',
      url: 'bg-indigo-100 text-indigo-800',
      date: 'bg-pink-100 text-pink-800',
      datetime: 'bg-red-100 text-red-800',
    };
    return colors[datatype] || 'bg-gray-100 text-gray-800';
  };

  const getWidgetBadgeColor = (widget: string) => {
    const colors: Record<string, string> = {
      text: 'bg-slate-100 text-slate-800',
      textarea: 'bg-slate-100 text-slate-800',
      select: 'bg-emerald-100 text-emerald-800',
      radio: 'bg-emerald-100 text-emerald-800',
      checkbox: 'bg-cyan-100 text-cyan-800',
      tags: 'bg-violet-100 text-violet-800',
      date: 'bg-rose-100 text-rose-800',
      datetime: 'bg-rose-100 text-rose-800',
      url: 'bg-amber-100 text-amber-800',
      color: 'bg-fuchsia-100 text-fuchsia-800',
      file: 'bg-teal-100 text-teal-800',
    };
    return colors[widget] || 'bg-gray-100 text-gray-800';
  };

  const getLabel = () => {
    const labelData = field.ui?.label;
    return labelData?.key ? t(labelData.key) : (labelData?.fallback || field.field_id);
  };

  const getPlaceholder = () => {
    const placeholderData = field.ui?.placeholder;
    return placeholderData?.key ? t(placeholderData.key) : (placeholderData?.fallback || '');
  };

  const getHelpText = () => {
    const helpData = field.ui?.help;
    return helpData?.key ? t(helpData.key) : (helpData?.fallback || '');
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <div>
                  <CardTitle className="text-lg">{getLabel()}</CardTitle>
                  <CardDescription>
                    {t('fieldId') || 'Field ID'}: <code className="text-xs bg-muted px-1 rounded">{field.field_id}</code>
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className={getDataTypeBadgeColor(field.datatype)}>
                  {field.datatype}
                </Badge>
                <Badge className={getWidgetBadgeColor(field.widget)}>
                  {field.widget}
                </Badge>
                {field.options?.source && (
                  <Badge variant="outline">
                    {field.options.source}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Field Renderer */}
              <div className="space-y-4">
                <h4 className="font-semibold">{t('interactivePreview') || 'Interactive Preview'}</h4>
              <DynamicFieldRenderer
                field={field}
                value={testValue}
                onChange={handleValueChange}
                formValues={formValues}
              />
                
                {testValue !== undefined && testValue !== null && testValue !== '' && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">{t('currentValue') || 'Current Value'}:</p>
                    <code className="text-xs">{JSON.stringify(testValue, null, 2)}</code>
                  </div>
                )}
              </div>

              {/* Field Metadata */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">{t('configuration') || 'Configuration'}</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">{t('datatype') || 'Datatype'}:</span> {field.datatype}
                    </div>
                    <div>
                      <span className="font-medium">{t('widget') || 'Widget'}:</span> {field.widget}
                    </div>
                    <div>
                      <span className="font-medium">{t('version') || 'Version'}:</span> {field.version}
                    </div>
                    {field.default_value !== null && field.default_value !== undefined && (
                      <div>
                        <span className="font-medium">{t('default') || 'Default'}:</span>{' '}
                        <code className="text-xs bg-muted px-1 rounded">
                          {JSON.stringify(field.default_value)}
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                {getHelpText() && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('helpText') || 'Help Text'}</h4>
                    <p className="text-sm text-muted-foreground">{getHelpText()}</p>
                  </div>
                )}

                {Object.keys(field.rules || {}).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('validationRules') || 'Validation Rules'}</h4>
                    <div className="text-xs">
                      <pre className="bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(field.rules, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {field.resolvedOptions && field.resolvedOptions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('options') || 'Options'} ({field.resolvedOptions.length})</h4>
                    <div className="max-h-40 overflow-y-auto text-xs">
                      <pre className="bg-muted p-2 rounded">
                        {JSON.stringify(field.resolvedOptions.slice(0, 10), null, 2)}
                        {field.resolvedOptions.length > 10 && `\n... ${t('andMore') || 'and'} ${field.resolvedOptions.length - 10} ${t('more') || 'more'}`}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}