import { useId } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { EmergingRisk, Level, Report } from "@/types";
import { AiTextarea } from "@/components/ui/AiTextarea";
import { useT } from "@/lib/i18n";

interface OutlookEditorProps {
  outlook: string;
  emergingRisks: EmergingRisk[];
  onUpdate: (patch: Partial<Pick<Report, "outlook" | "emergingRisks">>) => void;
}

const LEVELS: Level[] = ["low", "medium", "high", "critical"];

export default function OutlookEditor({ outlook, emergingRisks, onUpdate }: OutlookEditorProps) {
  const t = useT();
  const id = useId();

  const updateRisk = (index: number, patch: Partial<EmergingRisk>) =>
    onUpdate({ emergingRisks: emergingRisks.map((risk, i) => (i === index ? { ...risk, ...patch } : risk)) });

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{t("ed.outlook.title")}</h2>
      <p className="text-sm text-slate-500 mb-5">{t("ed.outlook.desc")}</p>

      <div className="mb-6">
        <label htmlFor={`${id}-outlook`} className="text-sm font-medium text-slate-700">
          {t("ed.outlook.label")}
        </label>
        <AiTextarea
          id={`${id}-outlook`}
          value={outlook}
          onValueChange={(value) => onUpdate({ outlook: value })}
          aiLabel={t("ed.outlook.title")}
          placeholder={t("ed.outlook.placeholder")}
          rows={6}
        />
      </div>

      <fieldset className="mb-5">
        <legend className="text-sm font-medium text-slate-700">{t("ed.outlook.emergingLabel")}</legend>
        <p className="mb-3 text-xs text-slate-500">{t("ed.outlook.emergingDesc")}</p>
        {emergingRisks.length === 0 ? (
          <p className="mb-3 text-sm text-slate-500">{t("ed.outlook.emergingEmpty")}</p>
        ) : (
          <div className="mb-3 flex flex-col gap-2">
            {emergingRisks.map((risk, index) => (
              <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={risk.description}
                  onChange={(e) => updateRisk(index, { description: e.target.value })}
                  placeholder={t("ed.outlook.emergingPlaceholder")}
                  aria-label={t("ed.outlook.emergingNumber", { number: index + 1 })}
                  className="form-input flex-1"
                />
                <select
                  value={risk.impact}
                  onChange={(e) => updateRisk(index, { impact: e.target.value as Level })}
                  aria-label={t("ed.risks.impact")}
                  className="form-input sm:w-36"
                >
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {t(`enum.${level}`)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon text-red-500"
                  onClick={() => onUpdate({ emergingRisks: emergingRisks.filter((_, i) => i !== index) })}
                  aria-label={t("ed.outlook.emergingRemove", { number: index + 1 })}
                  title={t("common.remove")}
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          className="cbr-btn cbr-btn-primary cbr-btn-sm"
          onClick={() => onUpdate({ emergingRisks: [...emergingRisks, { description: "", impact: "medium" }] })}
        >
          <Plus size={16} aria-hidden />
          {t("ed.outlook.emergingAdd")}
        </button>
      </fieldset>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mt-5">
        <span>{t("ed.outlook.tip")}</span>
      </div>
    </div>
  );
}
