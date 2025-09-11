import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditButton } from '@/components/ui/edit-button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { StoryboardFormNew } from '@/components/storyboard/StoryboardFormNew';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function StoryboardWorkspace() {
  const { jobId } = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Array<{id: string, name: string, description: string}>>([]);
  const [editingSections, setEditingSections] = useState({
    input: false,
    movieInfo: false,
    characters: false,
    props: false,
    timeline: false,
    music: false
  });
  
  // Load job data and templates
  useEffect(() => {
    const loadData = async () => {
      if (!jobId) return;
      
      setLoading(true);
      try {
        // Load job
        const { data: jobData, error: jobError } = await supabase
          .from('storyboard_jobs')
          .select('*')
          .eq('id', jobId)
          .maybeSingle();

        if (jobError) throw jobError;
        if (!jobData) {
          toast({
            title: t('error'),
            description: 'Job not found',
            variant: "destructive"
          });
          return;
        }

        setJob(jobData);

        // Load templates
        const { data: templatesData } = await supabase
          .from('templates')
          .select('id, name, description')
          .order('name');
        
        setTemplates(templatesData || []);
      } catch (error: any) {
        toast({
          title: t('error'),
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [jobId, t, toast]);

  const handleEditToggle = (section: keyof typeof editingSections) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSaveSection = async (section: string, data: any) => {
    try {
      const updateData: any = {};
      updateData[section] = data;
      if (section === 'user_input') {
        updateData.user_input_updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('storyboard_jobs')
        .update(updateData)
        .eq('id', jobId);

      if (error) throw error;

      // Update local state
      setJob((prev: any) => ({ ...prev, [section]: data }));
      setEditingSections(prev => ({ ...prev, [section.replace('_', '')]: false }));

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
    }
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="text-center text-muted-foreground">
          {t('jobNotFound')}
        </div>
      </div>
    );
  }

  const userInput = job.user_input || {};
  const movieInfo = job.movie_info || {};
  const characters = job.characters || {};
  const props = job.props || {};
  const timeline = job.timeline || {};
  const music = job.music || {};

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* User Input Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('userInput')}</CardTitle>
          <EditButton
            onClick={() => handleEditToggle('input')}
            isEditing={editingSections.input}
          />
        </CardHeader>
        <CardContent>
          {editingSections.input ? (
            <StoryboardFormNew
              mode="edit"
              initialData={userInput}
              onSave={(data) => handleSaveSection('user_input', data)}
              onCancel={() => handleEditToggle('input')}
            />
          ) : (
            <div className="space-y-4">
              {/* Template */}
              <div>
                <div className="text-sm font-medium text-primary">{t('storyboardTemplate')}</div>
                <div className="text-lg">
                  {templates.find(t => t.id === userInput.template)?.name || userInput.template || t('notSpecified')}
                </div>
              </div>

              {/* Size */}
              <div>
                <div className="text-sm font-medium text-primary">{t('sizeOption')}</div>
                <div className="text-lg">
                  {userInput.size === 'portrait' ? t('sizePortrait') : 
                   userInput.size === 'landscape' ? t('sizeLandscape') : 
                   t('notSpecified')}
                </div>
              </div>

              {/* Lead Character */}
              {userInput.characters?.lead && (
                <div>
                  <div className="text-sm font-medium text-primary">{t('leadCharacter')}</div>
                  <div className="flex items-center gap-3">
                    {userInput.characters.lead.faceImage && (
                      <img 
                        src={userInput.characters.lead.faceImage} 
                        alt={t('faceReferenceImage')} 
                        className="w-16 h-16 rounded object-cover" 
                      />
                    )}
                    <div>
                      <div className="text-lg font-semibold">
                        {userInput.characters.lead.name || t('notSpecified')}
                      </div>
                      {userInput.characters.lead.gender && (
                        <div className="text-sm text-muted-foreground">
                          {userInput.characters.lead.gender === 'male' ? t('male') : t('female')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Supporting Characters */}
              {userInput.characters?.supporting && Object.keys(userInput.characters.supporting).length > 0 && (
                <div>
                  <div className="text-sm font-medium text-primary">{t('supportingCharacters')}</div>
                  <div className="space-y-2 mt-2">
                    {Object.entries(userInput.characters.supporting).map(([key, character]: [string, any]) => (
                      <div key={key} className="flex items-center gap-3 p-2 border rounded">
                        {character.faceImage && (
                          <img 
                            src={character.faceImage} 
                            alt={character.name} 
                            className="w-8 h-8 rounded object-cover" 
                          />
                        )}
                        <div>
                          <div className="font-medium">{character.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {character.gender === 'male' ? t('male') : t('female')}
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
                  {t(userInput.language?.toLowerCase() || 'english')} ({userInput.accent || 'US'})
                </div>
              </div>

              {/* Genres */}
              <div>
                <div className="text-sm font-medium text-primary">{t('genres')}</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {userInput.genres?.length > 0 ? (
                    userInput.genres.map((genre: string) => (
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
                  {userInput.prompt || t('notSpecified')}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Movie Info Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('movieInfo')}</CardTitle>
          <EditButton
            onClick={() => handleEditToggle('movieInfo')}
            isEditing={editingSections.movieInfo}
          />
        </CardHeader>
        <CardContent>
          {editingSections.movieInfo ? (
            <div className="text-muted-foreground text-center py-8">
              Movie Info editing form - Coming soon
            </div>
          ) : (
            <div className="text-muted-foreground text-center py-8">
              {Object.keys(movieInfo).length === 0 ? t('noData') : 'Movie info display - Coming soon'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Characters Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('characters')}</CardTitle>
          <EditButton
            onClick={() => handleEditToggle('characters')}
            isEditing={editingSections.characters}
          />
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-8">
            {Object.keys(characters).length === 0 ? t('noData') : 'Characters display - Coming soon'}
          </div>
        </CardContent>
      </Card>

      {/* Props Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('props')}</CardTitle>
          <EditButton
            onClick={() => handleEditToggle('props')}
            isEditing={editingSections.props}
          />
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-8">
            {Object.keys(props).length === 0 ? t('noData') : 'Props display - Coming soon'}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('timeline')}</CardTitle>
          <EditButton
            onClick={() => handleEditToggle('timeline')}
            isEditing={editingSections.timeline}
          />
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-8">
            {Object.keys(timeline).length === 0 ? t('noData') : 'Timeline display - Coming soon'}
          </div>
        </CardContent>
      </Card>

      {/* Music Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('music')}</CardTitle>
          <EditButton
            onClick={() => handleEditToggle('music')}
            isEditing={editingSections.music}
          />
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-8">
            {Object.keys(music).length === 0 ? t('noData') : 'Music display - Coming soon'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}