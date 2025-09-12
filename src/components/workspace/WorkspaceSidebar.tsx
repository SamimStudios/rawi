import React from 'react';
import { 
  Film, 
  Users, 
  Package, 
  Play, 
  Music,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { WORKSPACE_SECTIONS } from '@/config/workspace';

interface WorkspaceSidebarProps {
  sections: Set<string>;
  currentSection: string | null;
  openSections: Set<string>;
  onSectionToggle: (section: string) => void;
  validationStatus: Record<string, any>;
  variant?: 'desktop' | 'mobile';
}

const SECTION_ICONS = {
  'movie_info': Film,
  'characters': Users,
  'props': Package,
  'timeline': Play,
  'music': Music
};

export function WorkspaceSidebar({ 
  sections, 
  currentSection, 
  openSections, 
  onSectionToggle, 
  validationStatus,
  variant = 'desktop'
}: WorkspaceSidebarProps) {
  const { t } = useLanguage();
  
  const getValidationIcon = (sectionKey: string) => {
    const status = validationStatus[sectionKey];
    if (!status) return null;
    
    switch (status.status) {
      case 'validating':
        return <Clock className="w-3 h-3 text-orange-500 animate-pulse" />;
      case 'valid':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'invalid':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getSectionProgress = (sectionKey: string) => {
    // TODO: Calculate actual completion percentage
    if (sections.has(sectionKey)) return 100;
    if (currentSection === sectionKey) return 50;
    return 0;
  };
  
  if (variant === 'mobile') {
    return (
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {WORKSPACE_SECTIONS.map((section) => {
          const Icon = SECTION_ICONS[section.key as keyof typeof SECTION_ICONS];
          const isActive = openSections.has(section.key);
          const isProcessing = currentSection === section.key;
          const progress = getSectionProgress(section.key);
          
          return (
            <Button
              key={section.key}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onSectionToggle(section.key)}
              className={cn(
                "flex items-center gap-2 min-w-0 whitespace-nowrap relative",
                isProcessing && "ring-2 ring-primary/50"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs truncate max-w-20">
                {t(section.titleKey)}
              </span>
              {getValidationIcon(section.key)}
              
              {/* Progress indicator */}
              {progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </Button>
          );
        })}
      </div>
    );
  }
  
  return (
    <aside className="w-64 bg-card border-r border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground mb-2">
          {t('workspaceNavigation') || 'Workspace'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t('workspaceNavigationDesc') || 'Navigate through different sections of your storyboard'}
        </p>
      </div>
      
      <nav className="p-2">
        {WORKSPACE_SECTIONS.map((section, index) => {
          const Icon = SECTION_ICONS[section.key as keyof typeof SECTION_ICONS];
          const isActive = openSections.has(section.key);
          const isProcessing = currentSection === section.key;
          const progress = getSectionProgress(section.key);
          const validation = validationStatus[section.key];
          
          return (
            <div key={section.key} className="mb-1">
              <Button
                variant={isActive ? "default" : "ghost"}
                onClick={() => onSectionToggle(section.key)}
                className={cn(
                  "w-full justify-start gap-3 h-auto p-3 relative",
                  isProcessing && "ring-2 ring-primary/50",
                  isActive && "bg-muted"
                )}
              >
                {/* Section icon */}
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                
                {/* Section content */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">
                      {t(section.titleKey)}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {getValidationIcon(section.key)}
                      <ChevronRight className={cn(
                        "w-3 h-3 transition-transform",
                        isActive && "rotate-90"
                      )} />
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-300 rounded-full",
                        progress === 100 ? "bg-green-600" : "bg-primary"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  {/* Validation message */}
                  {validation?.message && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {validation.message.en || validation.message.ar}
                    </p>
                  )}
                </div>
              </Button>
              
              {/* Section number indicator */}
              <div className="absolute left-1 top-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
                {index + 1}
              </div>
            </div>
          );
        })}
      </nav>
      
      {/* Help section */}
      <div className="p-4 mt-auto border-t border-border">
        <div className="p-3 bg-muted/50 rounded-lg">
          <h3 className="text-xs font-medium text-foreground mb-1">
            {t('needHelp') || 'Need Help?'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('workspaceHelpDesc') || 'Complete each section in order for the best results.'}
          </p>
        </div>
      </div>
    </aside>
  );
}