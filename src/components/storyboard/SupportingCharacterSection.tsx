import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Upload, Loader2, X, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { MAX_SUPPORTING_CHARACTERS } from '@/lib/storyboard-constants';
import type { SupportingCharacter } from '@/types/storyboard';

interface SupportingCharacterSectionProps {
  supportingCharacters: SupportingCharacter[];
  onCharactersChange: (characters: SupportingCharacter[]) => void;
  onImageUpload?: (characterId: string, file: File) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  disabled?: boolean;
}

export function SupportingCharacterSection({
  supportingCharacters,
  onCharactersChange,
  onImageUpload,
  isCollapsed = true,
  onToggleCollapse,
  disabled = false
}: SupportingCharacterSectionProps) {
  const { t, isRTL } = useLanguage();

  const addSupportingCharacter = () => {
    if (supportingCharacters.length >= MAX_SUPPORTING_CHARACTERS) return;
    
    const newCharacter: SupportingCharacter = {
      id: Date.now().toString(),
      name: '',
      gender: '',
      aiFace: false
    };
    onCharactersChange([...supportingCharacters, newCharacter]);
  };

  const removeSupportingCharacter = (id: string) => {
    onCharactersChange(supportingCharacters.filter(char => char.id !== id));
  };

  const updateSupportingCharacter = (id: string, field: keyof SupportingCharacter, value: string | boolean) => {
    onCharactersChange(supportingCharacters.map(char => 
      char.id === id ? { ...char, [field]: value } : char
    ));
  };

  const handleImageUpload = (characterId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;
    onImageUpload(characterId, file);
  };

  const removeCharacterImage = (characterId: string) => {
    onCharactersChange(supportingCharacters.map(char => 
      char.id === characterId 
        ? { ...char, faceImageUrl: undefined, faceImagePreview: undefined }
        : char
    ));
  };

  return (
    <Collapsible open={!isCollapsed} onOpenChange={onToggleCollapse}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className={cn("w-full justify-between", isRTL && "flex-row-reverse")}
          type="button"
          disabled={disabled}
        >
          <span>{t('supportingCharacters')} ({supportingCharacters.length}/{MAX_SUPPORTING_CHARACTERS})</span>
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4 mt-4">
        {supportingCharacters.map((character) => (
          <div key={character.id} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">{t('supportingCharacter')}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSupportingCharacter(character.id)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('name')} *</Label>
                <Input
                  value={character.name}
                  onChange={(e) => updateSupportingCharacter(character.id, 'name', e.target.value)}
                  placeholder={t('enterCharacterName')}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('gender')} *</Label>
                <Select 
                  value={character.gender} 
                  onValueChange={(value) => updateSupportingCharacter(character.id, 'gender', value)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectGender')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('male')}</SelectItem>
                    <SelectItem value="female">{t('female')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
              <Switch
                checked={character.aiFace}
                onCheckedChange={(checked) => updateSupportingCharacter(character.id, 'aiFace', checked)}
                disabled={disabled}
              />
              <Label>{t('aiGeneratedFace')}</Label>
            </div>

            {!character.aiFace && (
              <div className="space-y-2">
                <Label>{t('faceReferenceImage')}</Label>
                <div className="space-y-4">
                  {(character.faceImageUrl || character.faceImagePreview) ? (
                    <div className="relative inline-block">
                      <img 
                        src={character.faceImageUrl || character.faceImagePreview} 
                        alt={t('faceReferenceImage')} 
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => removeCharacterImage(character.id)}
                        disabled={character.isUploading || disabled}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      {character.isUploading ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
                          <p className="text-sm text-muted-foreground">{t('uploading')}</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-2">{t('uploadFaceReference')}</p>
                          {onImageUpload && (
                            <>
                              <Input
                                id={`supportingImage-${character.id}`}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(character.id, e)}
                                className="hidden"
                                disabled={disabled}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById(`supportingImage-${character.id}`)?.click()}
                                disabled={disabled}
                              >
                                {t('chooseImage')}
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {supportingCharacters.length < MAX_SUPPORTING_CHARACTERS && (
          <Button
            type="button"
            variant="outline"
            onClick={addSupportingCharacter}
            className={cn("w-full", isRTL && "flex-row-reverse")}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addSupportingCharacter')}
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}