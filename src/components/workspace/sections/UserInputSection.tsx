import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGE_OPTIONS, ACCENT_OPTIONS } from '@/config/workspace';
import { cn } from '@/lib/utils';

interface UserInputSectionProps {
  data: any;
  isEditing: boolean;
  onUpdate: (data: any) => void;
  onSetEditMode: (enabled: boolean) => void;
  isMobile: boolean;
}

export function UserInputSection({ data, isEditing, onUpdate, onSetEditMode, isMobile }: UserInputSectionProps) {
  const { t } = useLanguage();
  const [local, setLocal] = React.useState(() => normalizeIn(data));

  React.useEffect(() => {
    setLocal(normalizeIn(data));
  }, [data]);

  const handleChange = (field: string, value: any) => {
    const next = { ...local, [field]: value };
    setLocal(next);
    if (isEditing) onUpdate(normalizeOut(next));
  };

  const handleCharacterChange = (role: 'lead' | 'supporting', field: 'name' | 'gender', value: string) => {
    const next = {
      ...local,
      characters: {
        ...local.characters,
        [role]: { ...local.characters?.[role], [field]: value }
      }
    };
    setLocal(next);
    if (isEditing) onUpdate(normalizeOut(next));
  };

  const handleSave = () => {
    onUpdate(normalizeOut(local));
    onSetEditMode(false);
  };

  const handleCancel = () => {
    setLocal(normalizeIn(data));
    onSetEditMode(false);
  };

  const language = local.language || 'English';
  const accents = ACCENT_OPTIONS[language] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => onSetEditMode(true)}>
              {t('edit')}
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>{t('cancel')}</Button>
              <Button size="sm" onClick={handleSave}>{t('save')}</Button>
            </>
          )}
        </div>
      </div>

      <div className={cn('grid gap-4', isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2')}>
        {/* Language */}
        <div className="space-y-2">
          <Label>{t('language')}</Label>
          <Select value={local.language} onValueChange={(v) => handleChange('language', v)} disabled={!isEditing}>
            <SelectTrigger>
              <SelectValue placeholder={t('selectLanguage')} />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Accent */}
        <div className="space-y-2">
          <Label>{t('accent')}</Label>
          <Select value={local.accent} onValueChange={(v) => handleChange('accent', v)} disabled={!isEditing}>
            <SelectTrigger>
              <SelectValue placeholder={t('selectAccent')} />
            </SelectTrigger>
            <SelectContent>
              {accents.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lead name */}
        <div className="space-y-2">
          <Label>{t('leadName')}</Label>
          <Input value={local.characters?.lead?.name || ''} onChange={(e) => handleCharacterChange('lead','name', e.target.value)} disabled={!isEditing} />
        </div>

        {/* Lead gender */}
        <div className="space-y-2">
          <Label>{t('gender')}</Label>
          <Input value={local.characters?.lead?.gender || ''} onChange={(e) => handleCharacterChange('lead','gender', e.target.value)} disabled={!isEditing} />
        </div>

        {/* Prompt */}
        <div className="space-y-2 lg:col-span-2">
          <Label>{t('prompt')}</Label>
          <Textarea rows={3} value={local.prompt || ''} onChange={(e) => handleChange('prompt', e.target.value)} disabled={!isEditing} />
        </div>
      </div>
    </div>
  );
}

// Normalize incoming data to a consistent shape for the form
function normalizeIn(raw: any) {
  const ui = raw || {};
  const characters = ui.characters || {};
  const lead = characters.lead || {};
  const supporting = characters.supporting || {};
  return {
    template: ui.template || '',
    language: ui.language || 'English',
    accent: ui.accent || 'US',
    size: ui.size || '',
    prompt: ui.prompt || '',
    characters: {
      lead: {
        name: lead.name || ui.leadName || ui.lead_name || '',
        gender: lead.gender || ui.leadGender || ui.lead_gender || ''
      },
      supporting: supporting.name || supporting.gender ? supporting : undefined
    }
  };
}

// Normalize outgoing data to the canonical JSON stored in DB
function normalizeOut(form: any) {
  return {
    template: form.template || '',
    language: form.language || 'English',
    accent: form.accent || 'US',
    size: form.size || '',
    prompt: form.prompt || '',
    characters: {
      lead: {
        name: form.characters?.lead?.name || '',
        gender: form.characters?.lead?.gender || ''
      },
      ...(form.characters?.supporting ? { supporting: form.characters.supporting } : {})
    }
  };
}
