import { AlertTriangle, FileText, Presentation, Printer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useT, type MessageKey } from "@/lib/i18n";
import { Modal } from "@/components/ui/Modal";
import type { ExportFormat } from "./useReportExport";

interface ExportDialogProps {
  /** Report label shown in the description, e.g. "Q3 2026". */
  reportLabel: string;
  title?: string;
  /** Formats to offer. Default: all. */
  formats?: readonly ExportFormat[];
  /** Problems the user should look at before exporting. */
  warnings?: readonly string[];
  onCancel: () => void;
  onChoose: (format: ExportFormat) => void;
}

const OPTIONS: { format: ExportFormat; Icon: LucideIcon; label: MessageKey; hint: MessageKey }[] = [
  { format: "pdf-print", Icon: Printer, label: "export.print", hint: "export.printHint" },
  { format: "pdf-image", Icon: FileText, label: "export.original", hint: "export.originalHint" },
  { format: "pptx", Icon: Presentation, label: "export.pptx", hint: "export.pptxHint" },
];

export default function ExportDialog({
  reportLabel,
  title,
  formats,
  warnings = [],
  onCancel,
  onChoose,
}: ExportDialogProps) {
  const t = useT();
  const options = OPTIONS.filter((option) => !formats || formats.includes(option.format));
  return (
    <Modal title={title ?? t("export.title")} description={t("export.desc", { report: reportLabel })} onClose={onCancel}>
      {warnings.length > 0 && (
        <div role="status" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="mb-1 flex items-center gap-1.5 font-semibold">
            <AlertTriangle size={14} aria-hidden />
            {t("brief.warn.exportTitle")}
          </p>
          <ul className="m-0 list-disc pl-4">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {options.map(({ format, Icon, label, hint }, index) => (
          <button
            key={format}
            type="button"
            onClick={() => onChoose(format)}
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-primary"
            data-autofocus={index === 0 ? true : undefined}
          >
            <Icon size={18} className="shrink-0 text-slate-500" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-slate-800">{t(label)}</span>
              <span className="block text-xs text-slate-500">{t(hint)}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="cbr-btn cbr-btn-ghost" onClick={onCancel}>
          {t("common.cancel")}
        </button>
      </div>
    </Modal>
  );
}
