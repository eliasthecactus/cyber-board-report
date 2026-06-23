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
      <h2>{t("ed.exec.title")}</h2>
      <p className="text-base-content/70 text-sm mb-5">{t("ed.exec.desc")}</p>

      <div className="mb-5">
        <label className="label">
          <span className="label-text font-semibold">{t("ed.exec.label")}</span>
        </label>
        <AiTextarea
          value={data}
          onValueChange={onUpdate}
          aiLabel={t("ed.exec.title")}
          placeholder={t("ed.exec.placeholder")}
          rows={4}
        />
      </div>

      <div className="alert alert-info mt-5">
        <div>
          <span>{t("ed.exec.tip")}</span>
        </div>
      </div>
    </div>
  );
}
