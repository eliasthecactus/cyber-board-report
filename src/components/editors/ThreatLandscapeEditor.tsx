import { AiTextarea } from "@/components/ui/AiTextarea";
import { useT } from "@/lib/i18n";

interface ThreatLandscapeEditorProps {
  data: string;
  onUpdate: (data: string) => void;
}

export default function ThreatLandscapeEditor({
  data,
  onUpdate,
}: ThreatLandscapeEditorProps) {
  const t = useT();
  return (
    <div>
      <h2>{t("ed.threat.title")}</h2>
      <p className="text-base-content/70 text-sm mb-5">{t("ed.threat.desc")}</p>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">{t("ed.threat.label")}</span>
        </label>
        <AiTextarea
          value={data}
          onValueChange={onUpdate}
          aiLabel={t("ed.threat.title")}
          placeholder={t("ed.threat.placeholder")}
          rows={6}
        />
      </div>

      <div className="alert alert-info mt-5">
        <div>
          <span>{t("ed.threat.tip")}</span>
        </div>
      </div>
    </div>
  );
}
