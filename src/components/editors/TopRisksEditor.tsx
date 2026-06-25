import { Risk, Likelihood, Impact, Trend } from "@/types";
import { createId } from "@/lib/reportFactory";
import { Trash2 } from "lucide-react";
import { AiTextarea } from "@/components/ui/AiTextarea";
import { useT } from "@/lib/i18n";

interface TopRisksEditorProps {
  data: Risk[];
  onUpdate: (data: Risk[]) => void;
}

export default function TopRisksEditor({ data, onUpdate }: TopRisksEditorProps) {
  const t = useT();
  const addRisk = () => {
    const newRisk: Risk = {
      id: createId("risk"),
      name: "",
      likelihood: "low",
      businessImpact: "low",
      trend: "stable",
      historicalData: [],
    };
    onUpdate([...data, newRisk]);
  };

  const updateRisk = (id: string, updates: Partial<Risk>) => {
    onUpdate(data.map((risk) => (risk.id === id ? { ...risk, ...updates } : risk)));
  };

  const deleteRisk = (id: string) => {
    onUpdate(data.filter((risk) => risk.id !== id));
  };

  const riskAiContext = (risk: Risk): string =>
    [
      risk.name.trim() && `${t("ed.risks.nameLabel")}: ${risk.name.trim()}`,
      `${t("ed.risks.likelihood")}: ${t(`enum.${risk.likelihood}`)}`,
      `${t("ed.risks.impact")}: ${t(`enum.${risk.businessImpact}`)}`,
      `${t("ed.risks.trend")}: ${t(`enum.${risk.trend}`)}`,
    ]
      .filter(Boolean)
      .join("\n");

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{t("ed.risks.title")}</h2>
      <p className="text-sm text-slate-500 mb-5">{t("ed.risks.desc")}</p>

      <div className="flex flex-col gap-4 mb-4">
        {data.map((risk) => (
          <div key={risk.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex gap-3 items-center mb-3">
              <input
                type="text"
                placeholder={t("ed.risks.namePlaceholder")}
                value={risk.name}
                onChange={(e) => updateRisk(risk.id, { name: e.target.value })}
                className="form-input font-semibold flex-1"
              />
              <button
                onClick={() => deleteRisk(risk.id)}
                className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon text-red-500"
                aria-label={t("common.delete")}
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 mb-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">
                  {t("ed.risks.likelihood")}
                </span>
                <select
                  value={risk.likelihood}
                  onChange={(e) => updateRisk(risk.id, { likelihood: e.target.value as Likelihood })}
                  className="form-input form-input-sm"
                >
                  <option value="low">{t("enum.low")}</option>
                  <option value="medium">{t("enum.medium")}</option>
                  <option value="high">{t("enum.high")}</option>
                  <option value="critical">{t("enum.critical")}</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">
                  {t("ed.risks.impact")}
                </span>
                <select
                  value={risk.businessImpact}
                  onChange={(e) =>
                    updateRisk(risk.id, { businessImpact: e.target.value as Impact })
                  }
                  className="form-input form-input-sm"
                >
                  <option value="low">{t("enum.low")}</option>
                  <option value="medium">{t("enum.medium")}</option>
                  <option value="high">{t("enum.high")}</option>
                  <option value="critical">{t("enum.critical")}</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">
                  {t("ed.risks.trend")}
                </span>
                <select
                  value={risk.trend}
                  onChange={(e) => updateRisk(risk.id, { trend: e.target.value as Trend })}
                  className="form-input form-input-sm"
                >
                  <option value="improving">{t("enum.improving")}</option>
                  <option value="stable">{t("enum.stable")}</option>
                  <option value="worsening">{t("enum.worsening")}</option>
                </select>
              </label>
            </div>

            <AiTextarea
              aiLabel={t("ed.risks.descriptionLabel")}
              aiContext={riskAiContext(risk)}
              placeholder={t("ed.risks.descriptionPlaceholder")}
              value={risk.description || ""}
              onValueChange={(value) => updateRisk(risk.id, { description: value })}
              rows={2}
            />
          </div>
        ))}
      </div>

      <button className="cbr-btn cbr-btn-primary mt-4" onClick={addRisk}>
        {t("ed.risks.add")}
      </button>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mt-5">
        {t("ed.risks.tip")}
      </div>
    </div>
  );
}
