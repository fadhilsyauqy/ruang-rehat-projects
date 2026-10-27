import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Save, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import type { Dictionary } from "@/lib/dictionary";

export interface PropertyFormActionsProps {
  mode: "create" | "edit";
  loading: boolean;
  deleting: boolean;
  onDelete: () => void;
  t: Dictionary;
}

export function PropertyFormActions({
  mode,
  loading,
  deleting,
  onDelete,
  t,
}: PropertyFormActionsProps) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-3.5">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {mode === "create" ? t.publishActionsTitle : t.changeActionsTitle}
      </h4>

      <div className="space-y-2.5">
        <Button
          type="submit"
          disabled={loading || deleting}
          className="w-full h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{mode === "create" ? t.publishingProperty : t.savingProperty}</span>
            </>
          ) : mode === "create" ? (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>{t.publishPropertyBtn}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{t.savePropertyBtn}</span>
            </>
          )}
        </Button>

        <div className={mode === "edit" ? "flex gap-2" : "space-y-2"}>
          <Link
            href="/dashboard"
            className={`${mode === "edit" ? "flex-1" : "w-full"} py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.cancel}</span>
          </Link>

          {mode === "edit" && (
            <button
              type="button"
              disabled={loading || deleting}
              onClick={onDelete}
              className="px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>{deleting ? t.deletingProperty : t.deletePropertyBtn}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PropertyFormActions;
