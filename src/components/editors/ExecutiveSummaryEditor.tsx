import { useId } from "react";
import type { Report } from "@/types";
import { AiTextarea } from "@/components/ui/AiTextarea";
import { useT } from "@/lib/i18n";

interface ExecutiveSummaryEditorProps {
  summary: string;
  highlight: string;
  onUpdate: (patch: Partial<Pick<Report, "executiveSummary" | "executiveSummaryHighlight">>) => void;
}

export default function ExecutiveSummaryEditor({ summary, highlight, onUpdate }: ExecutiveSummaryEditorProps) {
  const t = useT();
  const id = useId();
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{t("ed.exec.title")}</h2>
      <p className="text-sm text-slate-500 mb-5">{t("ed.exec.desc")}</p>

      <div className="mb-5">
        <label htmlFor={`${id}-highlight`} className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("ed.exec.highlightLabel")}
        </label>
        <AiTextarea
          id={`${id}-highlight`}
          value={highlight}
          onValueChange={(value) => onUpdate({ executiveSummaryHighlight: value })}
          aiLabel={t("ed.exec.highlightLabel")}
          aiContext={summary}
          placeholder={t("ed.exec.highlightPlaceholder")}
          rows={2}
        />
      </div>

      <div className="mb-5">
        <label htmlFor={`${id}-summary`} className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("ed.exec.label")}
        </label>
        <AiTextarea
          id={`${id}-summary`}
          value={summary}
          onValueChange={(value) => onUpdate({ executiveSummary: value })}
          aiLabel={t("ed.exec.title")}
          placeholder={t("ed.exec.placeholder")}
          rows={4}
        />
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        {t("ed.exec.tip")}
      </div>
    </div>
  );
}
