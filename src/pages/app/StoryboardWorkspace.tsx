import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditButton } from '@/components/ui/edit-button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { StoryboardForm } from '@/components/storyboard/StoryboardForm';
import { supabase } from '@/integrations/supabase/client';

interface StoryboardWorkspaceProps {
  job?: any;
}

export default function StoryboardWorkspace({ job }: StoryboardWorkspaceProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  // Clean 3-object state pattern
  const [initial, setInitial] = useState<any>({});
  const [inProgress, setInProgress] = useState<any>({});
  const [submitted, setSubmitted] = useState<any>({});
  
  const [templates, setTemplates] = useState<Array<{id: string, name: string, description: string}>>([]);
  const [editingSections, setEditingSections] = useState({ input: false });
  const [openSections, setOpenSections] = useState({ input: true });
  const [loadingSections, setLoadingSections] = useState({ input: false });

  // Initialize state based on mode
  useEffect(() => {
    if (!job) {
      // Input mode: fresh data with user name
      const inputData = {
        leadName: user?.user_metadata?.full_name || '',
        template: '',
        leadGender: '',
        language: 'English',
        accent: 'US', 
        size: '',
        prompt: '',
        selectedGenres: [],
        faceImageUrl: null,
        supportingCharacters: []
      };
      setInitial(inputData);
      setInProgress({ ...inputData });
    } else if (job?.user_input) {
      // Edit mode: load from job.user_input
      setInitial(job.user_input);
      setInProgress({ ...job.user_input });
    }
  }, [user, job]);

  // Load templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data } = await supabase
          .from('templates')
          .select('id, name, description')
          .order('name');
        setTemplates(data || []);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };
    fetchTemplates();
  }, []);

  const handleEditToggle = (section: string) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const handleSaveInput = async () => {
    setLoadingSections(prev => ({ ...prev, input: true }));
    
    try {
      // Save inProgress data to database
      setSubmitted({ ...inProgress });
      
      // Here you would make the API call to save to storyboard_jobs
      console.log('Saving to database:', inProgress);
      
      setEditingSections(prev => ({ ...prev, input: false }));
      toast({
        title: t('success'),
        description: t('dataSaved')
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToSave'),
        variant: "destructive"
      });
    } finally {
      setLoadingSections(prev => ({ ...prev, input: false }));
    }
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>{t('userInput')}</CardTitle>
            <EditButton
              onClick={() => {
                handleEditToggle('input');
              }}
              disabled={false}
              isEditing={editingSections.input}
            />
          </div>
        </CardHeader>
        
        {openSections.input && (
          <CardContent className="space-y-4">
            {editingSections.input ? (
              <StoryboardForm
                mode="edit"
                inProgressData={inProgress}
                onUpdate={setInProgress}
                onSave={async (data) => {
                  setInProgress(data);
                  await handleSaveInput();
                }}
                onCancel={() => handleEditToggle('input')}
                disabled={loadingSections.input}
                isLoading={loadingSections.input}
              />
            ) : (
              <div className="space-y-4">
                {/* Template */}
                <div>
                  <div className="text-sm font-medium text-primary">{t('storyboardTemplate')}</div>
                  <div className="text-lg">
                    {templates.find(t => t.id === inProgress.template)?.name || inProgress.template || t('notSpecified')}
                  </div>
                </div>

                {/* Size */}
                <div>
                  <div className="text-sm font-medium text-primary">{t('sizeOption')}</div>
                  <div className="text-lg">
                    {inProgress.size === 'portrait' ? t('sizePortrait') : inProgress.size === 'landscape' ? t('sizeLandscape') : t('notSpecified')}
                  </div>
                </div>

                {/* Lead Character */}
                <div>
                  <div className="text-sm font-medium text-primary">{t('leadCharacter')}</div>
                  <div className="text-lg font-semibold">
                    {inProgress.leadName || t('notSpecified')} 
                    {inProgress.leadGender && ` (${inProgress.leadGender === 'male' ? t('male') : t('female')})`}
                  </div>
                  {inProgress.faceImageUrl && (
                    <img src={inProgress.faceImageUrl} alt={t('faceReferenceImage')} className="w-16 h-16 rounded object-cover mt-2" />
                  )}
                </div>

                {/* Supporting Characters */}
                {inProgress.supportingCharacters?.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-primary">{t('supportingCharacters')}</div>
                    <div className="space-y-2 mt-1">
                      {inProgress.supportingCharacters.map((character: any, index: number) => (
                        <div key={character.id} className="flex items-center gap-3 p-2 border rounded">
                          {character.faceImagePreview && (
                            <img src={character.faceImagePreview} alt={character.name} className="w-8 h-8 rounded object-cover" />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{character.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {character.gender === 'male' ? t('male') : t('female')}
                              {!character.faceImagePreview && ` • ${t('aiGenerated')}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Language & Accent */}
                <div>
                  <div className="text-sm font-medium text-primary">{t('languageAndAccent')}</div>
                  <div className="text-lg">
                    {t(inProgress.language?.toLowerCase() || 'english')} ({inProgress.accent || 'US'})
                  </div>
                </div>

                {/* Genres */}
                <div>
                  <div className="text-sm font-medium text-primary">{t('genres')}</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {inProgress.selectedGenres?.length > 0 ? (
                      inProgress.selectedGenres.map((genre: string) => (
                        <Badge key={genre} variant="secondary">{t(genre)}</Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">{t('notSpecified')}</span>
                    )}
                  </div>
                </div>

                {/* Plot Prompt */}
                <div>
                  <div className="text-sm font-medium text-primary">{t('plotPrompt')}</div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {inProgress.prompt || t('notSpecified')}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}