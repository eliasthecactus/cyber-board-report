import { AiTextarea } from "@/components/ui/AiTextarea";
import { useT } from "@/lib/i18n";

interface ExecutiveSummaryEditorProps {
  data: string;
  onUpdate: (data: string) => void;
}

export default function ExecutiveSummaryEditor({
  data,
  onUpdate,
}: ExecutiveSummaryEditorProps) {
  const t = useT();
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{t("ed.exec.title")}</h2>
      <p className="text-sm text-slate-500 mb-5">{t("ed.exec.desc")}</p>

      <div className="mb-5">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("ed.exec.label")}
        </label>
        <AiTextarea
          value={data}
          onValueChange={onUpdate}
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
