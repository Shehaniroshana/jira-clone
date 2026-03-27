import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'neon'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none"
    
    const variants = {
      default: "bg-primary/15 border border-primary/20 text-white backdrop-blur-md hover:bg-primary/25 hover:border-primary/40 shadow-sm",
      destructive: "bg-destructive/15 border border-destructive/20 text-white backdrop-blur-md hover:bg-destructive/25 hover:text-white shadow-sm",
      outline: "border border-slate-700 bg-slate-900/40 text-slate-300 hover:bg-slate-800/80 backdrop-blur-md hover:text-white",
      secondary: "bg-secondary/40 border border-secondary/50 text-white backdrop-blur-md hover:bg-secondary/60 shadow-sm",
      ghost: "text-slate-400 hover:bg-slate-800/40 hover:text-white backdrop-blur-sm",
      link: "text-primary underline-offset-4 hover:underline",
      neon: "bg-primary/15 border border-primary/20 text-white backdrop-blur-md hover:bg-primary/25 hover:border-primary/40 shadow-sm",
    }
    
    const sizes = {
      default: "h-11 py-2 px-5",
      sm: "h-9 px-3 text-xs rounded-md",
      lg: "h-12 px-8 text-base rounded-md",
      icon: "h-10 w-10 rounded-md",
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
