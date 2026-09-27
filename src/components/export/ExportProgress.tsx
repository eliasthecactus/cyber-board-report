import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { ExportState } from "./useReportExport";

/** Floating progress panel shown while an export runs. */
export function ExportProgress({ state, onCancel }: { state: ExportState; onCancel: () => void }) {
  const t = useT();
  const imageExport = state.format === "pdf-image";
  const percent = state.total ? Math.round((state.done / state.total) * 100) : 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <Loader2 size={14} className="animate-spin" aria-hidden />
        {imageExport
          ? t("export.progress", { current: Math.min(state.done + 1, state.total), total: state.total })
          : t("export.preparing")}
      </div>
      {imageExport && (
        <>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label={t("export.title")}
          >
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-3 flex justify-end">
            <button type="button" className="cbr-btn cbr-btn-ghost cbr-btn-xs" onClick={onCancel}>
              {t("common.cancel")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
