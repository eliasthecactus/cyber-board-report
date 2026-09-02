import { FileArchive, FileText } from "lucide-react";
import { useT } from "@/lib/i18n";

export type PdfExportMode = "original" | "compressed";

interface PdfExportDialogProps {
  /** Report label shown in the description, e.g. "Q3 2026". */
  reportLabel: string;
  onCancel: () => void;
  onChoose: (mode: PdfExportMode) => void;
}

export default function PdfExportDialog({
  reportLabel,
  onCancel,
  onChoose,
}: PdfExportDialogProps) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">{t("pdfExport.title")}</h2>
        <p className="mb-4 text-sm text-slate-500">
          {t("pdfExport.desc", { report: reportLabel })}
        </p>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => onChoose("original")}
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"
          >
            <FileText size={18} className="shrink-0 text-slate-500" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-slate-800">
                {t("pdfExport.original")}
              </span>
              <span className="block text-xs text-slate-400">{t("pdfExport.originalHint")}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => onChoose("compressed")}
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"
          >
            <FileArchive size={18} className="shrink-0 text-slate-500" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-slate-800">
                {t("pdfExport.compressed")}
              </span>
              <span className="block text-xs text-slate-400">{t("pdfExport.compressedHint")}</span>
            </span>
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="cbr-btn cbr-btn-ghost" onClick={onCancel}>
            {t("common.cancel")}
          </button>
        </div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={onCancel} />
    </div>
  );
}