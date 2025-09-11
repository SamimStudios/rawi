import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Coins } from "lucide-react";

import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Consolidated button system
        default: "bg-primary text-white hover:bg-primary/80 transition-colors duration-200", // Type 2 Blue
        destructive: "bg-accent text-white hover:bg-accent/80 transition-colors duration-200", // Type 2 Red
        outline: "border border-input bg-transparent text-foreground hover:bg-secondary/50",
        secondary: "border border-input bg-transparent text-foreground hover:bg-secondary/50",
        ghost: "bg-transparent text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200", // Type 4 Blue
        link: "text-primary underline-offset-4 hover:underline",
        primary: "bg-gradient-primary text-white font-bold hover:shadow-glow transition-all duration-300", // Type 1
        
        // Additional type variants for variety
        type_3_blue: "bg-transparent border border-primary/30 text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all duration-200",
        type_3_red: "bg-transparent border border-accent/30 text-foreground hover:bg-accent hover:text-white hover:border-accent transition-all duration-200",
        type_4_red: "bg-transparent text-foreground hover:text-accent hover:bg-accent/10 transition-all duration-200",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-[var(--radius)]",
        sm: "h-9 px-3 rounded-[var(--radius)]",
        lg: "h-11 px-8 rounded-[var(--radius)]",
        icon: "h-10 w-10 rounded-[var(--radius)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  functionId?: string; // N8N function ID for automatic credit display
  showCredits?: boolean; // Override to force show/hide credits
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, functionId, showCredits, children, ...props }, ref) => {
    const [functionData, setFunctionData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
      const fetchFunctionData = async () => {
        if (!functionId) return;
        
        setLoading(true);
        try {
          // Only proceed if we have a valid UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(functionId)) {
            console.warn('Invalid function ID format:', functionId);
            return;
          }

          const { data, error } = await supabase
            .from('n8n_functions')
            .select('price')
            .eq('id', functionId)
            .eq('active', true)
            .single();

          if (!error && data) {
            setFunctionData(data);
          }
        } catch (error) {
          console.error('Error fetching function data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchFunctionData();
    }, [functionId]);

    const Comp = asChild ? Slot : "button";
    const shouldShowCredits = (functionId && functionData && !loading) || showCredits === true;

    // Always render as simple button if there are any issues
    if (loading || (!functionData && functionId && showCredits !== true)) {
      return (
        <Comp 
          className={cn(buttonVariants({ variant, size, className }))} 
          ref={ref} 
          {...props}
        >
          <span className="flex items-center gap-2">
            {children}
          </span>
        </Comp>
      );
    }

    const buttonContent = (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        {...props}
      >
        <span className="flex items-center gap-2">
          {children}
          {shouldShowCredits && !props.disabled && (
            <span className="flex items-center gap-1 text-xs opacity-70">
              <Coins className="h-3 w-3" />
              {functionData?.price || '0'}
            </span>
          )}
        </span>
      </Comp>
    );

    // Wrap with tooltip if credits are shown
    if (shouldShowCredits && !props.disabled) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {buttonContent}
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                <span>This action will consume {functionData?.price || '0'} credits</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return buttonContent;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
