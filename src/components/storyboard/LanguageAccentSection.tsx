import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES, ACCENTS } from '@/lib/storyboard-constants';
import type { StoryboardFormData } from '@/types/storyboard';

interface LanguageAccentSectionProps {
  formData: StoryboardFormData;
  onInputChange: (field: keyof StoryboardFormData, value: string) => void;
  disabled?: boolean;
}

export function LanguageAccentSection({
  formData,
  onInputChange,
  disabled = false
}: LanguageAccentSectionProps) {
  const { t } = useLanguage();

  const getAvailableAccents = () => {
    const selectedLanguage = formData.language as keyof typeof ACCENTS;
    return ACCENTS[selectedLanguage] || [];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="language">{t('language')} *</Label>
        <Select 
          value={formData.language} 
          onValueChange={(value) => onInputChange('language', value)} 
          required
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectLanguage')} />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map(lang => (
              <SelectItem key={lang.value} value={lang.value}>
                {t(lang.key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accent">{t('accent')} *</Label>
        <Select 
          value={formData.accent} 
          onValueChange={(value) => onInputChange('accent', value)} 
          required
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectAccent')} />
          </SelectTrigger>
          <SelectContent>
            {getAvailableAccents().map(accent => (
              <SelectItem key={accent.value} value={accent.value}>
                {t(accent.key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}