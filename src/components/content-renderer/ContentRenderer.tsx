import React, { useState, useCallback, useMemo } from 'react';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FieldItemRenderer } from './FieldItemRenderer';

// Type definitions
interface I18nText {
  key?: string;
  fallback: string;
}

interface FieldItem {
  ref: string;
  idx: number;
  required?: boolean;
  editable?: boolean;
  importance?: "low" | "normal" | "high";
  rules?: Record<string, any>;
  repeatable?: {
    min?: number;
    max?: number;
  };
  item_instance_id?: number;
  value?: any;
  ui?: {
    override?: boolean;
    label?: I18nText;
    placeholder?: I18nText;
    help?: I18nText;
  };
}

interface Section {
  id: string;
  idx: number;
  label: I18nText;
  description?: I18nText;
  items: FieldItem[];
  subsections?: Section[];
  repeatable?: {
    min?: number;
    max?: number;
  };
  section_instance_id?: number;
  collapsed?: boolean;
  hidden?: boolean;
  required?: boolean;
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

interface ContentRendererProps {
  sections: Section[];
  fieldRegistry: FieldRegistry[];
  isEditing: boolean;
  formValues: Record<string, any>;
  onValueChange: (fieldPath: string, value: any) => void;
  validationErrors: Record<string, string>;
  generateFieldPath: (ancestorPath: string, itemRef: string, itemInstanceId?: number, arrayIndex?: number) => string;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({
  sections,
  fieldRegistry,
  isEditing,
  formValues,
  onValueChange,
  validationErrors,
  generateFieldPath
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const setSectionOpen = useCallback((sectionPath: string, open: boolean) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionPath]: !open,
    }));
  }, []);

  const addSectionInstance = useCallback((sectionId: string) => {
    toast.info('Add section instance functionality would be implemented here');
  }, []);

  const removeSectionInstance = useCallback((sectionId: string, instanceId: number) => {
    toast.info('Remove section instance functionality would be implemented here');
  }, []);

  return (
    <div className="space-y-3">
      {sections.map((section, idx) => (
        <SectionRenderer
          key={`${section.id}_${section.section_instance_id || 1}_${idx}`}
          section={section}
          fieldRegistry={fieldRegistry}
          isEditing={isEditing}
          formValues={formValues}
          onValueChange={onValueChange}
          validationErrors={validationErrors}
          generateFieldPath={generateFieldPath}
          ancestorPath={`root.${idx}`}
          depth={0}
          collapsedSections={collapsedSections}
          setSectionOpen={setSectionOpen}
          addSectionInstance={addSectionInstance}
          removeSectionInstance={removeSectionInstance}
        />
      ))}
    </div>
  );
};

interface SectionRendererProps {
  section: Section;
  fieldRegistry: FieldRegistry[];
  isEditing: boolean;
  formValues: Record<string, any>;
  onValueChange: (fieldPath: string, value: any) => void;
  validationErrors: Record<string, string>;
  generateFieldPath: (ancestorPath: string, itemRef: string, itemInstanceId?: number, arrayIndex?: number) => string;
  ancestorPath: string;
  depth: number;
  collapsedSections: Record<string, boolean>;
  setSectionOpen: (sectionPath: string, open: boolean) => void;
  addSectionInstance: (sectionId: string) => void;
  removeSectionInstance: (sectionId: string, instanceId: number) => void;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  fieldRegistry,
  isEditing,
  formValues,
  onValueChange,
  validationErrors,
  generateFieldPath,
  ancestorPath,
  depth,
  collapsedSections,
  setSectionOpen,
  addSectionInstance,
  removeSectionInstance
}) => {
  if (section.hidden) return null;

  const sectionPath = `${ancestorPath}.${section.id}${section.section_instance_id ? `_${section.section_instance_id}` : ''}`;
  const isCollapsed = collapsedSections[sectionPath] ?? section.collapsed ?? false;
  const isRepeatable = section.repeatable && section.repeatable.max && section.repeatable.max > 1;

  // Memoized sorted items and subsections
  const sortedItems = useMemo(() => 
    [...(section.items || [])].sort((a, b) => (a.idx || 0) - (b.idx || 0)),
    [section.items]
  );
  
  const sortedSubsections = useMemo(() => 
    [...(section.subsections || [])].sort((a, b) => (a.idx || 0) - (b.idx || 0)),
    [section.subsections]
  );

  const sectionBorderColor = depth === 0 ? "border-primary/20" : "border-muted-foreground/20";
  const sectionBgColor = depth === 0 ? "bg-card" : "bg-muted/30";

  return (
    <div className={cn(
      "rounded-lg border transition-all duration-200",
      sectionBorderColor,
      sectionBgColor,
      depth > 0 && "ml-4"
    )}>
      <Collapsible 
        open={!isCollapsed} 
        onOpenChange={(open) => setSectionOpen(sectionPath, open)}
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-3">
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform duration-200 text-muted-foreground",
                !isCollapsed && "rotate-90"
              )} />
              <div className="text-left">
                <h3 className={cn(
                  "font-semibold flex items-center gap-2",
                  depth === 0 ? "text-base" : "text-sm"
                )}>
                  {section.label.fallback}
                  {section.required && <span className="text-destructive">*</span>}
                  {isRepeatable && (
                    <Badge variant="outline" className="text-xs">
                      Instance {section.section_instance_id || 1}
                    </Badge>
                  )}
                </h3>
                {section.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {section.description.fallback}
                  </p>
                )}
              </div>
            </div>
            
            {isEditing && isRepeatable && (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => addSectionInstance(section.id)}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                {(section.section_instance_id || 1) > 1 && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => removeSectionInstance(section.id, section.section_instance_id || 1)}
                    className="h-6 w-6 p-0 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-3 pt-0 space-y-3">
            {/* Direct items */}
            {sortedItems.length > 0 && (
              <div className="space-y-2">
                {sortedItems.map((item) => {
                  const registry = fieldRegistry.find(r => r.id === item.ref);
                  if (!registry) {
                    return (
                      <div key={`${sectionPath}.${item.ref}_${item.item_instance_id || 1}`} 
                           className="p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-destructive text-sm">
                          Field registry not found for: {item.ref}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div key={`${sectionPath}.${item.ref}_${item.item_instance_id || 1}`}
                         className={cn(
                           "p-2 rounded-md border transition-all duration-200",
                           isEditing ? "bg-background border-border" : "bg-muted/30 border-transparent"
                         )}>
                      <FieldItemRenderer
                        item={item}
                        registry={registry}
                        isEditing={isEditing}
                        formValues={formValues}
                        onValueChange={onValueChange}
                        validationErrors={validationErrors}
                        generateFieldPath={generateFieldPath}
                        ancestorPath={sectionPath}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Subsections */}
            {sortedSubsections.length > 0 && (
              <div className="space-y-2">
                {sortedSubsections.map((subsection) => (
                  <SectionRenderer
                    key={`${subsection.id}_${subsection.section_instance_id || 1}`}
                    section={subsection}
                    fieldRegistry={fieldRegistry}
                    isEditing={isEditing}
                    formValues={formValues}
                    onValueChange={onValueChange}
                    validationErrors={validationErrors}
                    generateFieldPath={generateFieldPath}
                    ancestorPath={sectionPath}
                    depth={depth + 1}
                    collapsedSections={collapsedSections}
                    setSectionOpen={setSectionOpen}
                    addSectionInstance={addSectionInstance}
                    removeSectionInstance={removeSectionInstance}
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