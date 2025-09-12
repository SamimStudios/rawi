import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CharactersSectionProps {
  jobId: string;
  data: any;
  isEditing: boolean;
  onUpdate: (data: any) => void;
  isMobile: boolean;
  functionIds: {
    generateDescription?: string;
    validateDescription?: string;
    generatePortrait?: string;
  };
  execute: (functionId: string, payload: any) => Promise<any>;
}

export function CharactersSection({ jobId, data, isEditing, onUpdate, isMobile, functionIds, execute }: CharactersSectionProps) {
  const { t } = useLanguage();
  const [generatingDesc, setGeneratingDesc] = React.useState<Record<string, boolean>>({});
  const [validatingDesc, setValidatingDesc] = React.useState<Record<string, boolean>>({});
  const [generatingPortrait, setGeneratingPortrait] = React.useState<Record<string, boolean>>({});

  const characters = data || {};

  const fetchUpdated = async () => {
    const { data: refetched } = await supabase
      .from('storyboard_jobs')
      .select('characters, characters_updated_at')
      .eq('id', jobId)
      .maybeSingle();
    if (refetched?.characters) onUpdate(refetched.characters);
  };

  const handleGenerateDescription = async (role: 'lead' | 'supporting') => {
    const fid = functionIds.generateDescription;
    if (!fid) return;
    setGeneratingDesc(prev => ({ ...prev, [role]: true }));
    try {
      await execute(fid, { table_id: 'storyboard_jobs', row_id: jobId, character_key: role });
      await fetchUpdated();
    } finally {
      setGeneratingDesc(prev => ({ ...prev, [role]: false }));
    }
  };

  const handleValidateDescription = async (role: 'lead' | 'supporting') => {
    const fid = functionIds.validateDescription;
    if (!fid) return;
    setValidatingDesc(prev => ({ ...prev, [role]: true }));
    try {
      await execute(fid, { table_id: 'storyboard_jobs', row_id: jobId, character_key: role });
      await fetchUpdated();
    } finally {
      setValidatingDesc(prev => ({ ...prev, [role]: false }));
    }
  };

  const handleGeneratePortrait = async (role: 'lead' | 'supporting') => {
    const fid = functionIds.generatePortrait;
    if (!fid) return;
    setGeneratingPortrait(prev => ({ ...prev, [role]: true }));
    try {
      await execute(fid, { table_id: 'storyboard_jobs', row_id: jobId, character_key: role });
      await fetchUpdated();
    } finally {
      setGeneratingPortrait(prev => ({ ...prev, [role]: false }));
    }
  };

  const CharacterBlock = ({ role, title }: { role: 'lead' | 'supporting'; title: string }) => {
    const info = characters?.[role] || {};
    const base = info.base || {};
    const description = info.description || null;
    const portraitUrl = info.portrait_url || null;

    // Don't render supporting character if no data exists
    if (role === 'supporting' && !base.name && !base.gender) {
      return null;
    }

    return (
      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-semibold text-lg">{title}</h4>

        {/* Base info - read-only here; edited via Movie Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">{t('name')}</Label>
            <Input value={base.name || ''} disabled className="bg-muted/50" />
          </div>
          <div>
            <Label className="text-sm">{t('gender')}</Label>
            <Input value={base.gender || ''} disabled className="bg-muted/50" />
          </div>
        </div>

        {/* Description section */}
        <div className="space-y-2">
          <Label className="text-sm">{t('description')}</Label>
          {description ? (
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {Object.entries(description).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium capitalize">{key.replace(/_/g, ' ')}: </span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">{t('noDescriptionYet') || 'No description generated yet'}</div>
          )}

          {/* Description actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button 
              onClick={() => handleGenerateDescription(role)}
              disabled={!!generatingDesc[role] || !base.name || !base.gender}
              functionId={functionIds.generateDescription}
              showCredits
              size="sm"
              className="flex items-center gap-2"
            >
              {generatingDesc[role] ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {description ? t('regenerateDescription') || 'Regenerate' : t('generateDescription') || 'Generate Description'}
            </Button>

            {description && (
              <Button 
                onClick={() => handleValidateDescription(role)}
                disabled={!!validatingDesc[role]}
                variant="outline"
                size="sm"
                functionId={functionIds.validateDescription}
                showCredits
                className="flex items-center gap-2"
              >
                {validatingDesc[role] ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {t('validate')}
              </Button>
            )}
          </div>

          {!base.name || !base.gender ? (
            <p className="text-xs text-muted-foreground italic">
              {t('completeMovieInfoFirst') || 'Complete movie information first to generate character description'}
            </p>
          ) : null}
        </div>

        {/* Portrait */}
        <div className="space-y-2">
          <Label className="text-sm">{t('portrait')}</Label>
          {portraitUrl ? (
            <div className="space-y-2">
              <img src={portraitUrl} alt={`${title} portrait`} className="w-32 h-32 object-cover rounded-lg border" />
              <Button 
                onClick={() => handleGeneratePortrait(role)}
                disabled={!!generatingPortrait[role] || !description}
                functionId={functionIds.generatePortrait}
                showCredits
                size="sm"
                className="flex items-center gap-2"
              >
                {generatingPortrait[role] ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {t('regeneratePortrait') || 'Regenerate Portrait'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-32 h-32 bg-muted/50 rounded-lg border-2 border-dashed flex items-center justify-center">
                <span className="text-muted-foreground text-xs">{t('noPortrait') || 'No Portrait'}</span>
              </div>
              <Button 
                onClick={() => handleGeneratePortrait(role)}
                disabled={!!generatingPortrait[role] || !description}
                functionId={functionIds.generatePortrait}
                showCredits
                size="sm"
                className="flex items-center gap-2"
              >
                {generatingPortrait[role] ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {t('generatePortrait') || 'Generate Portrait'}
              </Button>
              
              {!description && (
                <p className="text-xs text-muted-foreground italic">
                  {t('generateDescriptionFirst') || 'Generate character description first'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', isMobile && 'px-1')}>
      <CharacterBlock role="lead" title={t('leadCharacter')} />
      {characters.supporting && <CharacterBlock role="supporting" title={t('supportingCharacter') || 'Supporting Character'} />}
    </div>
  );
}
