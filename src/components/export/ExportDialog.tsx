import { FileText, Presentation, Printer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useT, type MessageKey } from "@/lib/i18n";
import { Modal } from "@/components/ui/Modal";
import type { ExportFormat } from "./useReportExport";

interface ExportDialogProps {
  /** Report label shown in the description, e.g. "Q3 2026". */
  reportLabel: string;
  onCancel: () => void;
  onChoose: (format: ExportFormat) => void;
}

const OPTIONS: { format: ExportFormat; Icon: LucideIcon; label: MessageKey; hint: MessageKey }[] = [
  { format: "pdf-print", Icon: Printer, label: "export.print", hint: "export.printHint" },
  { format: "pdf-image", Icon: FileText, label: "export.original", hint: "export.originalHint" },
  { format: "pptx", Icon: Presentation, label: "export.pptx", hint: "export.pptxHint" },
];

export default function ExportDialog({ reportLabel, onCancel, onChoose }: ExportDialogProps) {
  const t = useT();
  return (
    <Modal title={t("export.title")} description={t("export.desc", { report: reportLabel })} onClose={onCancel}>
      <div className="flex flex-col gap-1.5">
        {OPTIONS.map(({ format, Icon, label, hint }, index) => (
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
