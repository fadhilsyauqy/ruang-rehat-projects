import React from "react"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  secondaryActionHref?: string
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-8 sm:p-12 text-center bg-gray-50/50 dark:bg-gray-900/30 flex flex-col items-center justify-center transition-all",
        className
      )}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-150 dark:border-gray-700/60 shadow-xs flex items-center justify-center mb-4 text-muted-foreground">
          <Icon className="w-7 h-7 text-gray-500 dark:text-gray-400" />
        </div>
      )}

      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
          {actionLabel &&
            (actionHref ? (
              <Link
                href={actionHref}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold px-4 py-2 h-auto cursor-pointer shadow-xs"
                )}
              >
                {actionLabel}
              </Link>
            ) : (
              <Button
                type="button"
                onClick={onAction}
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold px-4 py-2 h-auto cursor-pointer shadow-xs"
              >
                {actionLabel}
              </Button>
            ))}

          {secondaryActionLabel &&
            (secondaryActionHref ? (
              <Link
                href={secondaryActionHref}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "rounded-xl text-xs font-semibold px-4 py-2 h-auto cursor-pointer text-gray-700 dark:text-gray-300"
                )}
              >
                {secondaryActionLabel}
              </Link>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={onSecondaryAction}
                className="rounded-xl text-xs font-semibold px-4 py-2 h-auto cursor-pointer text-gray-700 dark:text-gray-300"
              >
                {secondaryActionLabel}
              </Button>
            ))}
        </div>
      )}
    </div>
  )
}

export default EmptyState
