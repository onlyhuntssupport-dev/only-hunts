import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      primary: "bg-amber-800 text-white hover:bg-amber-900 shadow-sm",
      outline: "border border-stone-200 bg-transparent hover:bg-stone-100 text-stone-900",
      ghost: "hover:bg-stone-100 text-stone-600",
      destructive: "bg-red-600 text-white hover:bg-red-700",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-8",
      icon: "h-9 w-9",
    };

    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ""}`;

    const Comp = asChild ? Slot : "button"

    return <Comp ref={ref} className={combinedClassName} {...props} />;
  }
);
Button.displayName = "Button";