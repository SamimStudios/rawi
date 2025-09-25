/**
 * SectionRenderer - Renders form sections with proper SSOT addressing
 * Supports both single sections and repeatable collections
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Minus } from 'lucide-react';
import { FormItemRenderer } from './FormItemRenderer';
import { SectionItem } from '@/lib/content-contracts';
import { Button } from '@/components/ui/button';
import type { JobNode } from '@/hooks/useJobs';

interface SectionRendererProps {
  /** The section item to render */
  section: SectionItem;
  /** Current job node for context */
  node: JobNode;
  /** Parent section path (for nested addressing) */
  parentPath?: string;
  /** Instance number if this section is within a collection */
  instanceNum?: number;
  /** Display mode */
  mode?: 'idle' | 'edit';
  /** Callback when section content changes */
  onChange?: (itemRef: string, value: any) => void;
}

/**
 * Renders sections as outlined blocks (not cards) following SSOT specification
 */
export function SectionRenderer({
  section,
  node,
  parentPath,
  instanceNum,
  mode = 'idle',
  onChange
}: SectionRendererProps) {
  const [isCollapsed, setIsCollapsed] = useState(section.collapsed || false);
  const [instances, setInstances] = useState<number[]>([1]); // Start with one instance

  console.log(`[SectionRenderer] Rendering section ${section.path}:`, section);

  // Build current section path for addressing
  const currentPath = parentPath ? `${parentPath}.${section.path}` : section.path;
  
  // Handle collection management
  const isRepeatable = !!section.repeatable;
  const minInstances = section.repeatable?.min || 1;
  const maxInstances = section.repeatable?.max || 10;
  const labelSingular = section.repeatable?.labelSingular || 'Item';
  const labelPlural = section.repeatable?.labelPlural || 'Items';

  const addInstance = () => {
    if (instances.length < maxInstances) {
      const newInstanceNum = Math.max(...instances) + 1;
      setInstances([...instances, newInstanceNum]);
    }
  };

  const removeInstance = (instanceToRemove: number) => {
    if (instances.length > minInstances) {
      setInstances(instances.filter(i => i !== instanceToRemove));
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Render section header
  const renderHeader = () => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="p-1 h-6 w-6"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <h4 className="font-medium text-foreground">
          {section.label.fallback}
          {isRepeatable && instances.length > 1 && (
            <span className="text-muted-foreground ml-2">
              ({instances.length} {instances.length === 1 ? labelSingular : labelPlural})
            </span>
          )}
        </h4>
      </div>
      
      {isRepeatable && mode === 'edit' && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={addInstance}
            disabled={instances.length >= maxInstances}
            className="h-7 px-2"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );

  // Render section description
  const renderDescription = () => {
    if (!section.description) return null;
    return (
      <p className="text-sm text-muted-foreground mb-3">
        {section.description.fallback}
      </p>
    );
  };

  // Render single instance of section content
  const renderInstance = (instanceNumber?: number) => (
    <div 
      key={instanceNumber || 'single'} 
      className={`space-y-3 ${instanceNumber ? 'border border-border rounded-lg p-3' : ''}`}
    >
      {instanceNumber && isRepeatable && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {labelSingular} {instanceNumber}
          </span>
          {instances.length > minInstances && mode === 'edit' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeInstance(instanceNumber)}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            >
              <Minus className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
      
      <div className="space-y-3">
        {section.children.map((child) => (
          <FormItemRenderer
            key={`${child.idx}-${instanceNumber || 'single'}`}
            item={child}
            node={node}
            parentPath={currentPath}
            instanceNum={instanceNumber}
            mode={mode}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="border-l-2 border-muted-foreground/20 pl-4 py-2">
      {renderHeader()}
      {!isCollapsed && (
        <>
          {renderDescription()}
          <div className="space-y-3">
            {isRepeatable ? (
              instances.map(instanceNum => renderInstance(instanceNum))
            ) : (
              renderInstance()
            )}
          </div>
        </>
      )}
    </div>
  );
}