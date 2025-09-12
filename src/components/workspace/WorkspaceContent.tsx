import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WorkspaceSection } from './sections/WorkspaceSection';
import { MovieInfoSection } from './sections/MovieInfoSection';
import { WorkspaceJob } from '@/hooks/useWorkspaceState';
import { WORKSPACE_SECTIONS } from '@/config/workspace';

interface WorkspaceContentProps {
  job: WorkspaceJob;
  sectionData: Record<string, any>;
  validationStatus: Record<string, any>;
  generationProgress: Record<string, number>;
  editMode: Record<string, boolean>;
  openSections: Set<string>;
  onUpdateSection: (section: string, data: any) => void;
  onToggleSection: (section: string) => void;
  onSetEditMode: (section: string, enabled: boolean) => void;
  onStartGeneration: (section: string) => void;
  isMobile: boolean;
}

export function WorkspaceContent({
  job,
  sectionData,
  validationStatus,
  generationProgress,
  editMode,
  openSections,
  onUpdateSection,
  onToggleSection,
  onSetEditMode,
  onStartGeneration,
  isMobile
}: WorkspaceContentProps) {
  
  return (
    <ScrollArea className="h-full">
      <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Welcome message */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome to your Workspace
          </h1>
          <p className="text-muted-foreground">
            Complete each section below to build your storyboard. Start with Movie Information and work your way through each step.
          </p>
        </div>

        {/* Render sections */}
        {WORKSPACE_SECTIONS.map((section) => {
          // Special handling for movie_info section
          if (section.key === 'movie_info') {
            return (
              <WorkspaceSection
                key={section.key}
                section={section}
                job={job}
                data={sectionData[section.key]}
                validation={validationStatus[section.key]}
                progress={generationProgress[section.key] || 0}
                isOpen={openSections.has(section.key)}
                isEditing={editMode[section.key] || false}
                onToggle={() => onToggleSection(section.key)}
                onUpdateData={(data) => onUpdateSection(section.key, data)}
                onSetEditMode={(enabled) => onSetEditMode(section.key, enabled)}
                onStartGeneration={() => onStartGeneration(section.key)}
                isMobile={isMobile}
              >
                <MovieInfoSection
                  data={sectionData[section.key]}
                  isEditing={editMode[section.key] || false}
                  isGenerating={(generationProgress[section.key] || 0) > 0 && (generationProgress[section.key] || 0) < 100}
                  validation={validationStatus[section.key]}
                  onUpdate={(data) => onUpdateSection(section.key, data)}
                  onGenerate={() => onStartGeneration(section.key)}
                  onSetEditMode={(enabled) => onSetEditMode(section.key, enabled)}
                  isMobile={isMobile}
                />
              </WorkspaceSection>
            );
          }
          
          // Default section rendering
          return (
            <WorkspaceSection
              key={section.key}
              section={section}
              job={job}
              data={sectionData[section.key]}
              validation={validationStatus[section.key]}
              progress={generationProgress[section.key] || 0}
              isOpen={openSections.has(section.key)}
              isEditing={editMode[section.key] || false}
              onToggle={() => onToggleSection(section.key)}
              onUpdateData={(data) => onUpdateSection(section.key, data)}
              onSetEditMode={(enabled) => onSetEditMode(section.key, enabled)}
              onStartGeneration={() => onStartGeneration(section.key)}
              isMobile={isMobile}
            />
          );
        })}
        
        {/* Bottom spacing for mobile navigation */}
        {isMobile && <div className="h-16" />}
      </div>
    </ScrollArea>
  );
}