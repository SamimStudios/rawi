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

        {/* Description actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => handleGenerateDescription(role)}
            disabled={!!generatingDesc[role]}
            functionId={functionIds.generateDescription}
            showCredits
            className="flex items-center gap-2"
          >
            {generatingDesc[role] ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {t('generateDescription')}
          </Button>

          <Button 
            onClick={() => handleValidateDescription(role)}
            disabled={!!validatingDesc[role]}
            variant="outline"
            functionId={functionIds.validateDescription}
            showCredits
            className="flex items-center gap-2"
          >
            {validatingDesc[role] ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {t('validate')}
          </Button>
        </div>

        {/* Portrait */}
        <div className="space-y-2">
          <Label className="text-sm">{t('portrait')}</Label>
          {portraitUrl ? (
            <img src={portraitUrl} alt={`${title} portrait`} className="w-40 h-40 object-cover rounded-lg border" />
          ) : (
            <div className="text-sm text-muted-foreground">{t('noPortraitYet') || 'No portrait yet'}</div>
          )}
          <div>
            <Button 
              onClick={() => handleGeneratePortrait(role)}
              disabled={!!generatingPortrait[role]}
              functionId={functionIds.generatePortrait}
              showCredits
              className="flex items-center gap-2"
            >
              {generatingPortrait[role] ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {t('generatePortrait')}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', isMobile && 'px-1')}>
      <CharacterBlock role="lead" title={t('leadCharacter')} />
      <CharacterBlock role="supporting" title={t('supportingCharacter') || 'Supporting Character'} />
    </div>
  );
}
