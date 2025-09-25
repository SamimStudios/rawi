import React from 'react';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditsButtonProps {
  onClick: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  credits?: number;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children: React.ReactNode;
  stopPropagation?: boolean;
}

export const CreditsButton: React.FC<CreditsButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  credits,
  size = 'sm',
  className,
  children,
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
      variant="outline"
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        "gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-800 hover:from-amber-100 hover:to-yellow-100 hover:border-amber-300",
        "dark:from-amber-950/20 dark:to-yellow-950/20 dark:border-amber-800 dark:text-amber-200 dark:hover:from-amber-900/30 dark:hover:to-yellow-900/30",
        className
      )}
      {...props}
    >
      <Coins className="h-4 w-4" />
      {children}
      {credits !== undefined && (
        <span className="text-xs font-medium">
          {credits}
        </span>
      )}
    </Button>
  );
};