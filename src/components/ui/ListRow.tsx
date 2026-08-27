import * as React from "react"
import { cn } from "@/lib/utils"

export interface ListRowProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  /** Main text (e.g. description or name) */
  title: React.ReactNode;
  /** Secondary line under the title (date, category chip, etc.) */
  meta?: React.ReactNode;
  /** Right-aligned content, usually the amount */
  trailing?: React.ReactNode;
}

/** Tappable 2-line list row: full-width <button>, ≥56px tall, press feedback. */
const ListRow = React.forwardRef<HTMLButtonElement, ListRowProps>(
  ({ className, title, meta, trailing, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "w-full min-h-14 flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent",
          className
        )}
        {...props}
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-medium text-gray-900">{title}</div>
          {meta && <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">{meta}</div>}
        </div>
        {trailing && <div className="shrink-0 font-mono tabular-nums text-base font-semibold text-gray-900">{trailing}</div>}
      </button>
    )
  }
)
ListRow.displayName = "ListRow"

export { ListRow }
