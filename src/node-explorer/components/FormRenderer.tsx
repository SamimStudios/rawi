import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Code, Eye, EyeOff } from 'lucide-react';
import { Node, FormContent, FormGroup, FormItem } from '../types/node';
import { useFieldRegistry } from '../hooks/useFieldRegistry';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, getTextDirection, getLocalizedText } from '../utils/i18n';

interface FormRendererProps {
  node: Node;
}

export function FormRenderer({ node }: FormRendererProps) {
  const { language } = useLanguage();
  const [showJson, setShowJson] = useState(false);
  const textDirection = getTextDirection(language);

  const formContent = node.content as FormContent;
  const groups = formContent.groups || [];
  const items = formContent.items || [];

  // Get all field refs for registry lookup
  const fieldRefs = items.map(item => item.ref);
  const { fields, loading, getFieldLabel, getFieldPlaceholder, getFieldHelp } = useFieldRegistry(fieldRefs);

  // Group items by their parent group
  const itemsByGroup = items.reduce((acc, item) => {
    const groupName = item.parent?.group_name || 'default';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(item);
    return acc;
  }, {} as Record<string, FormItem[]>);

  return (
    <div className="space-y-4" dir={textDirection}>
      {/* Form Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>📋</span>
              <span>{t('form', language)} Content</span>
              <Badge variant="outline">{groups.length} groups, {items.length} items</Badge>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowJson(!showJson)}
              className="flex items-center gap-2"
            >
              {showJson ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showJson ? t('hideJson', language) : t('showJson', language)}
            </Button>
          </div>
        </CardHeader>
        {showJson && (
          <CardContent>
            <div className="p-4 bg-muted/30 rounded-md">
              <pre className="text-sm text-muted-foreground overflow-auto">
                {JSON.stringify(formContent, null, 2)}
              </pre>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Form Groups */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No form groups defined
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group, groupIndex) => (
            <FormGroupCard
              key={groupIndex}
              group={group}
              items={itemsByGroup[group.group_name] || []}
              fields={fields}
              loading={loading}
              language={language}
              getFieldLabel={getFieldLabel}
              getFieldPlaceholder={getFieldPlaceholder}
              getFieldHelp={getFieldHelp}
            />
          ))}
        </div>
      )}

      {/* Ungrouped Items */}
      {itemsByGroup.default && itemsByGroup.default.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ungrouped Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {itemsByGroup.default.map((item, index) => (
                <FormItemCard
                  key={index}
                  item={item}
                  field={fields[item.ref]}
                  loading={loading}
                  language={language}
                  getFieldLabel={getFieldLabel}
                  getFieldPlaceholder={getFieldPlaceholder}
                  getFieldHelp={getFieldHelp}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface FormGroupCardProps {
  group: FormGroup;
  items: FormItem[];
  fields: any;
  loading: boolean;
  language: string;
  getFieldLabel: (ref: string, lang: string) => string;
  getFieldPlaceholder: (ref: string, lang: string) => string;
  getFieldHelp: (ref: string, lang: string) => string;
}

function FormGroupCard({ 
  group, 
  items, 
  fields, 
  loading, 
  language, 
  getFieldLabel, 
  getFieldPlaceholder, 
  getFieldHelp 
}: FormGroupCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  const groupTitle = group.title ? getLocalizedText(group.title, language as 'en' | 'ar') : group.group_name;
  const layoutIcon = getGroupLayoutIcon(group.layout);
  const importanceColor = getImportanceColor(group.importance);

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="text-lg">{layoutIcon}</span>
                </div>
                <div>
                  <CardTitle className="text-lg">{groupTitle}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {group.layout || 'section'}
                    </Badge>
                    {group.importance && (
                      <Badge className={`text-xs ${importanceColor}`}>
                        {group.importance}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {items.length} items
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {group.repeatable && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">Repeatable</Badge>
                  {group.repeatable.min !== undefined && (
                    <span className="text-muted-foreground">Min: {group.repeatable.min}</span>
                  )}
                  {group.repeatable.max !== undefined && (
                    <span className="text-muted-foreground">Max: {group.repeatable.max}</span>
                  )}
                </div>
                {(group.repeatable.labelSingular || group.repeatable.labelPlural) && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {group.repeatable.labelSingular && (
                      <span>Singular: {group.repeatable.labelSingular}</span>
                    )}
                    {group.repeatable.labelPlural && (
                      <span className="ml-4">Plural: {group.repeatable.labelPlural}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No items in this group
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <FormItemCard
                    key={index}
                    item={item}
                    field={fields[item.ref]}
                    loading={loading}
              language={language as 'en' | 'ar'}
              getFieldLabel={(ref: string) => getFieldLabel(ref, language as 'en' | 'ar')}
              getFieldPlaceholder={(ref: string) => getFieldPlaceholder(ref, language as 'en' | 'ar')}
              getFieldHelp={(ref: string) => getFieldHelp(ref, language as 'en' | 'ar')}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

interface FormItemCardProps {
  item: FormItem;
  field: any;
  loading: boolean;
  language: string;
  getFieldLabel: (ref: string, lang: string) => string;
  getFieldPlaceholder: (ref: string, lang: string) => string;
  getFieldHelp: (ref: string, lang: string) => string;
}

function FormItemCard({ 
  item, 
  field, 
  loading, 
  language, 
  getFieldLabel, 
  getFieldPlaceholder, 
  getFieldHelp 
}: FormItemCardProps) {
  const label = getFieldLabel(item.ref, language);
  const placeholder = getFieldPlaceholder(item.ref, language);
  const help = getFieldHelp(item.ref, language);

  return (
    <div className="p-3 border border-border rounded-md bg-background">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{label}</span>
            <Badge variant={item.required ? "destructive" : "secondary"} className="text-xs">
              {item.required ? t('required', language) : t('optional', language)}
            </Badge>
            {field && (
              <Badge variant="outline" className="text-xs">
                {field.widget}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono mb-1">
            {item.ref}
          </p>
          {placeholder && (
            <p className="text-xs text-muted-foreground">
              <strong>Placeholder:</strong> {placeholder}
            </p>
          )}
          {help && (
            <p className="text-xs text-muted-foreground">
              <strong>Help:</strong> {help}
            </p>
          )}
        </div>
        
        {loading ? (
          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
        ) : field ? (
          <Badge variant="outline" className="text-xs">
            {field.datatype}
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-xs">
            Missing
          </Badge>
        )}
      </div>

      {field?.options && (
        <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
          <details>
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Field Options
            </summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(field.options, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

function getGroupLayoutIcon(layout?: string): string {
  switch (layout) {
    case 'accordion':
      return '📁';
    case 'tab':
      return '📑';
    case 'inline':
      return '➡️';
    default:
      return '📋';
  }
}

function getImportanceColor(importance?: string): string {
  switch (importance) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'low':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  }
}