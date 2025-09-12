import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { EditButton } from '@/components/ui/edit-button';
import { Loader2, CheckCircle, Save, X, RefreshCw } from 'lucide-react';

interface MemoizedCharacterButtonsProps {
  characterKey: string;
  isEditing: boolean;
  isValidating: boolean;
  isGeneratingDescription: boolean;
  validationStatus: 'validating' | 'valid' | 'invalid' | null;
  hasValidateFunction: boolean;
  onValidate: () => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  validateFunctionId?: string;
  generateFunctionId?: string;
  t: (key: string) => string;
}

export const MemoizedCharacterButtons = memo<MemoizedCharacterButtonsProps>(({
  characterKey,
  isEditing,
  isValidating,
  isGeneratingDescription,
  validationStatus,
  hasValidateFunction,
  onValidate,
  onSave,
  onCancel,
  onEdit,
  onRegenerate,
  validateFunctionId,
  generateFunctionId,
  t
}) => {
  console.log('🔄 MemoizedCharacterButtons render for:', characterKey, 'isEditing:', isEditing);
  
  if (isEditing) {
    return (
      <div className="flex gap-2">
        {/* Validate Button - Shows credits */}
        <Button
          type="button"
          size="sm"
          onClick={onValidate}
          disabled={validationStatus === 'validating'}
          className="flex items-center gap-1.5 px-3"
          functionId={validateFunctionId}
          showCredits={true}
        >
          {validationStatus === 'validating' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <CheckCircle className="h-4 w-4" />
          {validationStatus === 'validating' ? t('validating') : t('validate')}
        </Button>

        {/* Save Button - Disabled until validated */}
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={onSave}
          disabled={
            isValidating ||
            (hasValidateFunction && validationStatus !== 'valid')
          }
          className="flex items-center gap-1.5 px-3"
        >
          {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          {isValidating ? t('saving') : t('save')}
          {hasValidateFunction && validationStatus !== 'valid' && (
            <span className="text-xs opacity-75">
              {t('validateFirst')}
            </span>
          )}
        </Button>

        {/* Cancel Button */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3"
        >
          <X className="h-4 w-4" />
          {t('cancel')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <EditButton
        onClick={onEdit}
        isEditing={isEditing}
        variant="ghost"
        size="sm"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRegenerate}
        disabled={isGeneratingDescription}
        functionId={generateFunctionId}
        showCredits={true}
        className="flex items-center gap-1.5 px-3"
      >
        {isGeneratingDescription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
});

MemoizedCharacterButtons.displayName = 'MemoizedCharacterButtons';