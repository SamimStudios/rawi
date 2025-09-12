import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WorkspaceSection } from './sections/WorkspaceSection';
import { MovieInfoSection } from './sections/MovieInfoSection';
import { UserInputSection } from './sections/UserInputSection';
import { CharactersSection } from './sections/CharactersSection';
import { WorkspaceJob } from '@/hooks/useWorkspaceState';
import { WORKSPACE_SECTIONS } from '@/config/workspace';
import { useN8nFunctions } from '@/hooks/useN8nFunctions';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  onSetValidation: (section: string, validation: any) => void;
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
  onSetValidation,
  isMobile
}: WorkspaceContentProps) {
  const { user } = useAuth();
  const { byName: fnByName } = useN8nFunctions([
    'generate-movie-info',
    'validate-movie-info',
    'generate-character-description',
    'validate-character-description',
    'generate-character-portrait'
  ]);

  const executeById = async (functionId: string | undefined, payload: any) => {
    if (!functionId) return null;
    const { data: envelope, error } = await supabase.functions.invoke('execute-function', {
      body: {
        function_id: functionId,
        payload,
        user_id: user?.id || null
      }
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
    if (envelope?.status === 'error') {
      const msg = typeof envelope?.error?.message === 'string' ? envelope.error.message : (envelope?.error?.message?.en || envelope?.error?.message?.ar || 'Failed');
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return envelope;
    }
    return envelope;
  };

  return (
    <ScrollArea className="h-full">
      <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Welcome message */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Workspace</h1>
          <p className="text-muted-foreground">Build your storyboard step by step.</p>
        </div>

        {/* User Input Section (custom) */}
        <WorkspaceSection
          key="user_input"
          section={{ key: 'user_input', titleKey: 'initialInput', icon: 'Users', fields: [] }}
          job={job}
          data={sectionData['user_input'] || job.user_input}
          validation={validationStatus['user_input']}
          progress={generationProgress['user_input'] || 0}
          isOpen={openSections.has('user_input')}
          isEditing={editMode['user_input'] || false}
          onToggle={() => onToggleSection('user_input')}
          onUpdateData={(d) => onUpdateSection('user_input', d)}
          onSetEditMode={(en) => onSetEditMode('user_input', en)}
          onStartGeneration={() => {}}
          isMobile={isMobile}
        >
          <UserInputSection
            data={sectionData['user_input'] || job.user_input}
            isEditing={editMode['user_input'] || false}
            onUpdate={(d) => onUpdateSection('user_input', d)}
            onSetEditMode={(en) => onSetEditMode('user_input', en)}
            isMobile={isMobile}
          />
        </WorkspaceSection>

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
                onStartGeneration={async () => {
                  const fid = fnByName['generate-movie-info']?.id;
                  await executeById(fid, { table_id: 'storyboard_jobs', row_id: job.id });
                  const { data: refetched } = await supabase
                    .from('storyboard_jobs')
                    .select('movie_info, movie_info_updated_at')
                    .eq('id', job.id)
                    .maybeSingle();
                  if (refetched?.movie_info) onUpdateSection('movie_info', refetched.movie_info);
                }}
                isMobile={isMobile}
              >
                <MovieInfoSection
                  data={sectionData[section.key]}
                  isEditing={editMode[section.key] || false}
                  isGenerating={(generationProgress[section.key] || 0) > 0 && (generationProgress[section.key] || 0) < 100}
                  validation={validationStatus[section.key]}
                  onUpdate={(data) => onUpdateSection(section.key, data)}
                  onGenerate={async () => {
                    const fid = fnByName['generate-movie-info']?.id;
                    await executeById(fid, { table_id: 'storyboard_jobs', row_id: job.id });
                    const { data: refetched } = await supabase
                      .from('storyboard_jobs')
                      .select('movie_info, movie_info_updated_at')
                      .eq('id', job.id)
                      .maybeSingle();
                    if (refetched?.movie_info) onUpdateSection('movie_info', refetched.movie_info);
                  }}
                  onValidate={async (edits) => {
                    const fid = fnByName['validate-movie-info']?.id;
                    const envelope = await executeById(fid, { table_id: 'storyboard_jobs', row_id: job.id, edits });
                    if (envelope?.data?.parsed) {
                      const parsed = envelope.data.parsed;
                      onSetValidation('movie_info', {
                        status: parsed.valid ? 'valid' : 'invalid',
                        message: parsed.reason || null,
                        suggestedFix: parsed.suggested_fix || parsed.suggestedFix || null
                      });
                    }
                  }}
                  generateFunctionId={fnByName['generate-movie-info']?.id}
                  validateFunctionId={fnByName['validate-movie-info']?.id}
                  onSetEditMode={(enabled) => onSetEditMode(section.key, enabled)}
                  isMobile={isMobile}
                />
              </WorkspaceSection>
            );
          }
          
          // Characters section rendering
          if (section.key === 'characters') {
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
                onStartGeneration={() => {}}
                isMobile={isMobile}
              >
                <CharactersSection
                  jobId={job.id}
                  data={sectionData[section.key]}
                  isEditing={editMode[section.key] || false}
                  onUpdate={(data) => onUpdateSection(section.key, data)}
                  isMobile={isMobile}
                  functionIds={{
                    generateDescription: fnByName['generate-character-description']?.id,
                    validateDescription: fnByName['validate-character-description']?.id,
                    generatePortrait: fnByName['generate-character-portrait']?.id
                  }}
                  execute={(fid, payload) => executeById(fid, payload)}
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