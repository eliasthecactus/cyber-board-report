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
      <h2 className="text-lg font-semibold text-slate-900">{t("ed.outlook.title")}</h2>
      <p className="text-sm text-slate-500 mb-5">{t("ed.outlook.desc")}</p>

      <div className="mb-5">
        <label>
          <span className="text-sm font-medium text-slate-700">{t("ed.outlook.label")}</span>
        </label>
        <AiTextarea
          value={data}
          onValueChange={onUpdate}
          aiLabel={t("ed.outlook.title")}
          placeholder={t("ed.outlook.placeholder")}
          rows={6}
        />
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mt-5">
        <div>
          <span>{t("ed.outlook.tip")}</span>
        </div>
      </div>
    </div>
  );
}
