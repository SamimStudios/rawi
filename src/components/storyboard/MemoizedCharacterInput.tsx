import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MemoizedCharacterInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: 'input' | 'textarea';
  disabled?: boolean;
}

// Memoized input component to prevent unnecessary re-renders during character editing
const MemoizedCharacterInput = React.memo<MemoizedCharacterInputProps>(
  ({ value, onChange, placeholder, className, type = 'textarea', disabled }) => {
    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e.target.value);
    }, [onChange]);

    if (type === 'input') {
      return (
        <Input
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(className)}
          disabled={disabled}
        />
      );
    }

    return (
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(className)}
        disabled={disabled}
      />
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if essential props change
    return (
      prevProps.value === nextProps.value &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.className === nextProps.className &&
      prevProps.type === nextProps.type
    );
  }
);

MemoizedCharacterInput.displayName = "MemoizedCharacterInput";

export { MemoizedCharacterInput };