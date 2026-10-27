"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { AlertTriangle, AlertCircle, Info, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type ConfirmVariant = "default" | "destructive" | "warning"

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
  loading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "destructive",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false)
  const isProcessing = loading || internalLoading

  const handleConfirm = async () => {
    try {
      setInternalLoading(true)
      await onConfirm()
    } finally {
      setInternalLoading(false)
    }
  }

  const handleCancel = () => {
    if (isProcessing) return
    if (onCancel) {
      onCancel()
    }
    onOpenChange(false)
  }

  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        )
      case "warning":
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
        )
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center shrink-0">
            <Info className="w-6 h-6" />
          </div>
        )
    }
  }

  const getConfirmButtonClass = () => {
    switch (variant) {
      case "destructive":
        return "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500 text-white shadow-sm"
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500 text-white shadow-sm"
      default:
        return "bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 shadow-sm"
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !isProcessing && onOpenChange(val)}>
      <DialogContent className="max-w-md p-6 sm:p-7 rounded-3xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl">
        <DialogHeader className="space-y-3">
          {getIcon()}
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 text-left">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed text-left">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-150 dark:border-gray-800 mt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
              getConfirmButtonClass()
            )}
          >
            {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmDialog
