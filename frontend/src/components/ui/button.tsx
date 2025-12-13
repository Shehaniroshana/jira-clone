import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'neon'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none active:scale-95"
    
    const variants = {
      default: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5",
      destructive: "bg-red-600 text-white shadow-lg shadow-red-500/25 hover:bg-red-700 hover:shadow-red-500/40",
      outline: "border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-slate-600",
      secondary: "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white",
      ghost: "text-slate-400 hover:bg-slate-800/50 hover:text-white",
      link: "text-cyan-400 underline-offset-4 hover:underline hover:text-cyan-300",
      neon: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:-translate-y-0.5",
    }
    
    const sizes = {
      default: "h-11 py-2 px-5",
      sm: "h-9 px-3 text-xs rounded-lg",
      lg: "h-12 px-8 text-base rounded-2xl",
      icon: "h-10 w-10 rounded-xl",
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
