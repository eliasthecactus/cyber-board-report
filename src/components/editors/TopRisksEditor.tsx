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

  return (
    <div>
      <h2>{t("ed.risks.title")}</h2>
      <p className="text-base-content/70 text-sm mb-5">{t("ed.risks.desc")}</p>

      <div className="flex flex-col gap-4 mb-4">
        {data.map((risk) => (
          <div key={risk.id} className="bg-base-200 border border-base-300 rounded p-4">
            <div className="flex gap-3 items-center mb-3">
              <input
                type="text"
                placeholder={t("ed.risks.namePlaceholder")}
                value={risk.name}
                onChange={(e) => updateRisk(risk.id, { name: e.target.value })}
                className="input input-bordered font-semibold text-base flex-1"
              />
              <button
                onClick={() => deleteRisk(risk.id)}
                className="btn btn-sm btn-ghost text-error"
                aria-label={t("common.delete")}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 mb-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-base-content/60">
                  {t("ed.risks.likelihood")}
                </span>
                <select
                  value={risk.likelihood}
                  onChange={(e) => updateRisk(risk.id, { likelihood: e.target.value as Likelihood })}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="low">{t("enum.low")}</option>
                  <option value="medium">{t("enum.medium")}</option>
                  <option value="high">{t("enum.high")}</option>
                  <option value="critical">{t("enum.critical")}</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-base-content/60">
                  {t("ed.risks.impact")}
                </span>
                <select
                  value={risk.businessImpact}
                  onChange={(e) =>
                    updateRisk(risk.id, { businessImpact: e.target.value as Impact })
                  }
                  className="select select-bordered select-sm w-full"
                >
                  <option value="low">{t("enum.low")}</option>
                  <option value="medium">{t("enum.medium")}</option>
                  <option value="high">{t("enum.high")}</option>
                  <option value="critical">{t("enum.critical")}</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-base-content/60">
                  {t("ed.risks.trend")}
                </span>
                <select
                  value={risk.trend}
                  onChange={(e) => updateRisk(risk.id, { trend: e.target.value as Trend })}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="improving">{t("enum.improving")}</option>
                  <option value="stable">{t("enum.stable")}</option>
                  <option value="worsening">{t("enum.worsening")}</option>
                </select>
              </label>
            </div>

            <AiTextarea
              aiLabel={t("ed.risks.descriptionLabel")}
              placeholder={t("ed.risks.descriptionPlaceholder")}
              value={risk.description || ""}
              onValueChange={(value) => updateRisk(risk.id, { description: value })}
              rows={2}
            />
          </div>
        ))}
      </div>

      <button className="btn btn-success mt-4" onClick={addRisk}>
        {t("ed.risks.add")}
      </button>

      <div className="alert alert-info mt-5">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>{t("ed.risks.tip")}</span>
      </div>
    </div>
  );
}
