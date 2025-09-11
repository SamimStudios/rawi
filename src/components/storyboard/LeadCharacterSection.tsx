import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { StoryboardFormData } from '@/types/storyboard';

interface LeadCharacterSectionProps {
  formData: StoryboardFormData;
  onInputChange: (field: keyof StoryboardFormData, value: string | boolean) => void;
  faceImageUrl?: string | null;
  faceImagePreview?: string | null;
  isUploadingFaceImage?: boolean;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: () => void;
  disabled?: boolean;
}

export function LeadCharacterSection({
  formData,
  onInputChange,
  faceImageUrl,
  faceImagePreview,
  isUploadingFaceImage = false,
  onImageUpload,
  onRemoveImage,
  disabled = false
}: LeadCharacterSectionProps) {
  const { t, isRTL } = useLanguage();
  
  const displayImageUrl = faceImageUrl || faceImagePreview;

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <h3 className="text-lg font-semibold">{t('leadCharacter')}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="leadName">{t('leadName')} *</Label>
          <Input
            id="leadName"
            value={formData.leadName}
            onChange={(e) => onInputChange('leadName', e.target.value)}
            placeholder={t('enterLeadCharacterName')}
            required
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leadGender">{t('gender')} *</Label>
          <Select 
            value={formData.leadGender} 
            onValueChange={(value) => onInputChange('leadGender', value)} 
            required 
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="faceImage">{t('faceReferenceImage')}</Label>
          <div className={cn("flex items-center text-xs px-2 py-1 rounded-full", 
            displayImageUrl ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800")}>
            {displayImageUrl ? t('realFace') : t('aiGenerated')}
          </div>
        </div>
        <div className="space-y-4">
          {displayImageUrl ? (
            <div className="relative inline-block">
              <img 
                src={displayImageUrl} 
                alt={t('faceReferenceImage')} 
                className="w-32 h-32 object-cover rounded-lg border"
              />
              {onRemoveImage && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={onRemoveImage}
                  disabled={isUploadingFaceImage || disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              {isUploadingFaceImage ? (
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
                        id="faceImage"
                        type="file"
                        accept="image/*"
                        onChange={onImageUpload}
                        className="hidden"
                        disabled={disabled}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('faceImage')?.click()}
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
    </div>
  );
}