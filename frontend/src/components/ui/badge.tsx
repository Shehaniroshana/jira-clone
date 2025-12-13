import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
    secondary: "bg-slate-700/50 text-slate-300 border border-slate-600/50",
    destructive: "bg-red-500/20 text-red-400 border border-red-500/30",
    outline: "text-slate-300 border border-slate-600",
    success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
