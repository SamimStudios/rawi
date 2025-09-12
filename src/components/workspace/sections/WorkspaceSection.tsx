import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { WorkspaceSection as WorkspaceSectionType } from '@/config/workspace';
import { WorkspaceJob } from '@/hooks/useWorkspaceState';

interface WorkspaceSectionProps {
  section: WorkspaceSectionType;
  job: WorkspaceJob;
  data: any;
  validation: any;
  progress: number;
  isOpen: boolean;
  isEditing: boolean;
  onToggle: () => void;
  onUpdateData: (data: any) => void;
  onSetEditMode: (enabled: boolean) => void;
  onStartGeneration: () => void;
  isMobile: boolean;
  children?: React.ReactNode; // Allow custom content
}

export function WorkspaceSection({
  section,
  job,
  data,
  validation,
  progress,
  isOpen,
  isEditing,
  onToggle,
  onUpdateData,
  onSetEditMode,
  onStartGeneration,
  isMobile,
  children
}: WorkspaceSectionProps) {
  const { t } = useLanguage();
  
  // Dynamic icon import based on section icon name
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Film':
        return <span className="w-5 h-5 flex items-center justify-center">🎬</span>;
      case 'Users':
        return <span className="w-5 h-5 flex items-center justify-center">👤</span>;
      case 'Package':
        return <span className="w-5 h-5 flex items-center justify-center">📦</span>;
      case 'Play':
        return <span className="w-5 h-5 flex items-center justify-center">▶️</span>;
      case 'Music':
        return <span className="w-5 h-5 flex items-center justify-center">🎵</span>;
      default:
        return <span className="w-5 h-5 flex items-center justify-center">📝</span>;
    }
  };
  
  const getValidationBadge = () => {
    if (!validation) return null;
    
    switch (validation.status) {
      case 'validating':
        return (
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            Validating...
          </div>
        );
      case 'valid':
        return (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Valid
          </div>
        );
      case 'invalid':
        return (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            Needs attention
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card className={cn(
        "transition-all duration-200",
        isOpen && "ring-1 ring-primary/20",
        isMobile && "mx-0"
      )}>
        <CollapsibleTrigger asChild>
          <CardHeader className={cn(
            "cursor-pointer hover:bg-muted/50 transition-colors",
            "flex flex-row items-center justify-between p-4",
            isMobile && "p-3"
          )}>
            <div className="flex items-center gap-3">
              {getIcon(section.icon)}
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {t(section.titleKey)}
                </h3>
                {section.description && (
                  <p className="text-sm text-muted-foreground truncate">
                    {section.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              {getValidationBadge()}
              
              {/* Progress indicator */}
              {progress > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span>{progress}%</span>
                </div>
              )}
              
              {/* Expand/collapse icon */}
              {isOpen ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className={cn("pt-0", isMobile && "px-3")}>
            {/* Custom content if provided, otherwise default placeholder */}
            {children || (
              <div className="space-y-4">
                {/* Default placeholder content */}
                <div className="p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 text-center">
                  <h4 className="text-lg font-medium text-foreground mb-2">
                    {t(section.titleKey)} Section
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    This section will contain the actual form fields and content for {t(section.titleKey).toLowerCase()}.
                  </p>
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-center gap-2">
                    {section.generateFunctionId && (
                      <Button 
                        onClick={onStartGeneration}
                        disabled={progress > 0 && progress < 100}
                        className="flex items-center gap-2"
                      >
                        {progress > 0 && progress < 100 ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>Generate {t(section.titleKey)}</>
                        )}
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline"
                      onClick={() => onSetEditMode(!isEditing)}
                    >
                      {isEditing ? 'Save' : 'Edit'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Validation message - Always show if present */}
            {validation?.message && (
              <div className={cn(
                "p-3 rounded-lg text-sm mt-4",
                validation.status === 'invalid' && "bg-red-50 text-red-700 border border-red-200",
                validation.status === 'valid' && "bg-green-50 text-green-700 border border-green-200"
              )}>
                {validation.message.en || validation.message.ar}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}