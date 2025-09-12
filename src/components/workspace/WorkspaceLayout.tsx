import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceContent } from './WorkspaceContent';
import { DebugPanel } from './DebugPanel';
import { useWorkspaceState } from '@/hooks/useWorkspaceState';

interface WorkspaceLayoutProps {
  jobId: string;
}

export function WorkspaceLayout({ jobId }: WorkspaceLayoutProps) {
  const isMobile = useIsMobile();
  const { state, actions } = useWorkspaceState(jobId);
  
  if (state.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }
  
  if (state.error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-destructive text-xl">⚠</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
          <p className="text-muted-foreground">{state.error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  
  if (!state.job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
            <span className="text-muted-foreground text-xl">📋</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Job not found</h2>
          <p className="text-muted-foreground">The workspace you're looking for doesn't exist or has been deleted.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Debug Panel - Only in development */}
      <div className="container mx-auto px-4 pt-4">
        <DebugPanel 
          job={state.job}
          isLoading={state.loading}
          error={state.error}
        />
      </div>
      
      {/* Header - Always visible */}
      <WorkspaceHeader 
        job={state.job}
        unsavedChanges={state.unsavedChanges}
        onSave={() => actions.saveAll()}
      />
      
      {/* Main workspace area */}
      <div className="flex h-[calc(100vh-64px)]"> {/* 64px for header height */}
        {/* Sidebar - Hidden on mobile, collapsible on desktop */}
        {!isMobile && (
          <WorkspaceSidebar 
            sections={state.activeSections}
            currentSection={state.generatingSection}
            openSections={state.openSections}
            onSectionToggle={actions.toggleSection}
            validationStatus={state.sectionValidation}
          />
        )}
        
        {/* Main content area */}
        <div className={cn(
          "flex-1 overflow-hidden",
          !isMobile && "border-l border-border"
        )}>
          <WorkspaceContent 
            job={state.job}
            sectionData={state.sectionData}
            validationStatus={state.sectionValidation}
            generationProgress={state.generationProgress}
            editMode={state.editMode}
            openSections={state.openSections}
            onUpdateSection={actions.updateSectionData}
            onToggleSection={actions.toggleSection}
            onSetEditMode={actions.setEditMode}
            onStartGeneration={actions.startGeneration}
            onSetValidation={actions.setSectionValidation}
            isMobile={isMobile}
          />
        </div>
      </div>
      
      {/* Mobile bottom navigation - Only on mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 safe-area-pb">
          <WorkspaceSidebar 
            sections={state.activeSections}
            currentSection={state.generatingSection}
            openSections={state.openSections}
            onSectionToggle={actions.toggleSection}
            validationStatus={state.sectionValidation}
            variant="mobile"
          />
        </div>
      )}
    </div>
  );
}