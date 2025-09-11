import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditButtonProps {
  onClick: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  isEditing?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link' | 'primary' | 'type_3_blue' | 'type_3_red' | 'type_4_red';
  className?: string;
  stopPropagation?: boolean;
}

export const EditButton: React.FC<EditButtonProps> = ({
  onClick,
  disabled = false,
  isEditing = false,
  size = 'sm',
  variant = 'ghost',
  className,
  stopPropagation = true,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    onClick(e);
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleClick}
      disabled={disabled}
      className={cn("", className)}
      {...props}
    >
      {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
    </Button>
  );
};