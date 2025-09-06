import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface RTLWrapperProps {
  children: React.ReactNode;
  className?: string;
  reverseOnRTL?: boolean;
}

/**
 * RTL Wrapper component that automatically handles RTL layouts
 * Use this to wrap components that need RTL-aware styling
 */
export const RTLWrapper: React.FC<RTLWrapperProps> = ({ 
  children, 
  className,
  reverseOnRTL = false 
}) => {
  const { isRTL } = useLanguage();
  
  return (
    <div 
      className={cn(
        className,
        isRTL && reverseOnRTL && "flex-row-reverse",
        isRTL && "text-right"
      )}
    >
      {children}
    </div>
  );
};

/**
 * RTL-aware flex container
 */
export const RTLFlex: React.FC<RTLWrapperProps & { 
  reverse?: boolean;
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
}> = ({ 
  children, 
  className, 
  reverse = false,
  justify = 'start',
  align = 'center'
}) => {
  const { isRTL } = useLanguage();
  
  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end', 
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };
  
  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center', 
    baseline: 'items-baseline',
    stretch: 'items-stretch'
  };
  
  return (
    <div 
      className={cn(
        "flex",
        justifyClasses[justify],
        alignClasses[align],
        isRTL && reverse && "flex-row-reverse",
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Hook for RTL-aware spacing classes
 */
export const useRTLSpacing = () => {
  const { isRTL } = useLanguage();
  
  return {
    ml: (size: string) => isRTL ? `mr-${size}` : `ml-${size}`,
    mr: (size: string) => isRTL ? `ml-${size}` : `mr-${size}`,
    pl: (size: string) => isRTL ? `pr-${size}` : `pl-${size}`,
    pr: (size: string) => isRTL ? `pl-${size}` : `pr-${size}`,
    left: (size: string) => isRTL ? `right-${size}` : `left-${size}`,
    right: (size: string) => isRTL ? `left-${size}` : `right-${size}`,
  };
};