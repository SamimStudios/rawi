import React, { memo, useCallback } from 'react';
import { Input } from '@/components/ui/input';

interface MemoizedCharacterFieldProps {
  characterKey: string;
  field: string;
  value: string;
  label: string;
  onChange: (characterKey: string, field: string, value: string) => void;
}

export const MemoizedCharacterField = memo<MemoizedCharacterFieldProps>(({
  characterKey,
  field,
  value,
  label,
  onChange
}) => {
  console.log('🔄 MemoizedCharacterField render for:', characterKey, field, value);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(characterKey, field, e.target.value);
  }, [characterKey, field, onChange]);

  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <Input
        value={value}
        onChange={handleChange}
        className="mt-1"
        onFocus={() => console.log('🎯 Input focused:', characterKey, field)}
        onBlur={() => console.log('🎯 Input blurred:', characterKey, field)}
      />
    </div>
  );
});

MemoizedCharacterField.displayName = 'MemoizedCharacterField';