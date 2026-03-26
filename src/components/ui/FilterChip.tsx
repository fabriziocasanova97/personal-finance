import * as React from "react"
import { cn } from "@/lib/utils"

export interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ className, active, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm border px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50",
          active
            ? "border-accent bg-accent/10 text-accent hover:bg-accent/20"
            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
FilterChip.displayName = "FilterChip"

export { FilterChip }
