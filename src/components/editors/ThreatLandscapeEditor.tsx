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
      <h2 className="text-lg font-semibold text-slate-900">{t("ed.threat.title")}</h2>
      <p className="text-sm text-slate-500 mb-5">{t("ed.threat.desc")}</p>

      <div className="mb-5">
        <label>
          <span className="text-sm font-medium text-slate-700">{t("ed.threat.label")}</span>
        </label>
        <AiTextarea
          value={data}
          onValueChange={onUpdate}
          aiLabel={t("ed.threat.title")}
          placeholder={t("ed.threat.placeholder")}
          rows={6}
        />
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mt-5">
        <div>
          <span>{t("ed.threat.tip")}</span>
        </div>
      </div>
    </div>
  );
}
