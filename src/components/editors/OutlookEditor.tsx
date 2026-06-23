import { AiTextarea } from "@/components/ui/AiTextarea";
import { useT } from "@/lib/i18n";

interface OutlookEditorProps {
  data: string;
  onUpdate: (data: string) => void;
}

export default function OutlookEditor({ data, onUpdate }: OutlookEditorProps) {
  const t = useT();
  return (
    <div>
      <h2>{t("ed.outlook.title")}</h2>
      <p className="text-base-content/70 text-sm mb-5">{t("ed.outlook.desc")}</p>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">{t("ed.outlook.label")}</span>
        </label>
        <AiTextarea
          value={data}
          onValueChange={onUpdate}
          aiLabel={t("ed.outlook.title")}
          placeholder={t("ed.outlook.placeholder")}
          rows={6}
        />
      </div>

      <div className="alert alert-info mt-5">
        <div>
          <span>{t("ed.outlook.tip")}</span>
        </div>
      </div>
    </div>
  );
}
