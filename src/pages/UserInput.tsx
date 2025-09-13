import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { DynamicUserInputForm } from '@/components/forms/DynamicUserInputForm';

export default function UserInput() {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const jobId = searchParams.get('job_id');

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {t('User Input Form')}
          </h1>
          <p className="text-muted-foreground">
            {t('Configure your storyboard preferences and character details')}
          </p>
        </div>
        
        <DynamicUserInputForm jobId={jobId} />
      </div>
    </main>
  );
}