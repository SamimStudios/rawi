import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { StoryboardFormSection } from '@/components/storyboard/StoryboardFormSection';

export default function StoryboardPlayground() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessionId } = useGuestSession();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (jobData: any) => {
    setIsLoading(true);

    try {
      // Call the create-storyboard-job edge function
      const { data, error } = await supabase.functions.invoke('create-storyboard-job', {
        body: {
          ...jobData,
          leadName: jobData.characters.lead.name,
          leadGender: jobData.characters.lead.gender,
          faceImageUrl: jobData.characters.lead.faceImageUrl,
          supportingCharacters: jobData.characters.supporting || [],
          userId: user?.id || null,
          sessionId: sessionId || null
        }
      });

      if (error) {
        console.error('Error creating storyboard job:', error);
        toast({
          title: t('error'),
          description: error.message || t('unexpectedError'),
          variant: "destructive"
        });
        return;
      }

      toast({
        title: t('storyboardJobCreated'),
        description: t('processingRedirecting')
      });

      // Navigate to storyboard workspace
      navigate(`/app/storyboard/${data.jobId}`);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t('error'),
        description: t('unexpectedError'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">{t('storyboardPlayground')}</CardTitle>
          <p className="text-muted-foreground text-center">
            {t('createPersonalizedStoryboard')}
          </p>
        </CardHeader>
        <CardContent>
          <StoryboardFormSection
            onSubmit={handleSubmit}
            isLoading={isLoading}
            showConsentCheckbox={true}
            submitButtonText={t('createStoryboard')}
          />
        </CardContent>
      </Card>
    </div>
  );
}