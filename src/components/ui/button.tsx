import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Legacy variants
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-transparent text-foreground hover:bg-secondary/50",
        secondary: "border border-input bg-transparent text-foreground hover:bg-secondary/50",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        primary: "bg-gradient-primary text-white hover:shadow-glow font-semibold",
        
        // New button system
        type_1: "bg-gradient-primary text-white font-bold hover:shadow-glow transition-all duration-300",
        type_2_blue: "bg-primary text-white hover:bg-primary/80 transition-colors duration-200",
        type_2_red: "bg-accent text-white hover:bg-accent/80 transition-colors duration-200",
        type_3_blue: "bg-transparent border border-primary/30 text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all duration-200",
        type_3_red: "bg-transparent border border-accent/30 text-foreground hover:bg-accent hover:text-white hover:border-accent transition-all duration-200",
        type_4_blue: "bg-transparent text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
