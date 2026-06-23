import { SupplyChainRisk } from "@/types";
import { Plus } from "lucide-react";
import { AiTextarea } from "@/components/ui/AiTextarea";
import { useT } from "@/lib/i18n";

interface SupplyChainEditorProps {
  data: SupplyChainRisk;
  onUpdate: (data: SupplyChainRisk) => void;
}

export default function SupplyChainEditor({
  data,
  onUpdate,
}: SupplyChainEditorProps) {
  const t = useT();
  const updateField = (field: keyof SupplyChainRisk, value: string[] | string) => {
    onUpdate({ ...data, [field]: value });
  };

  const addRisk = () => {
    updateField("risks", [...data.risks, ""]);
  };

  const updateRisk = (index: number, value: string) => {
    const updated = [...data.risks];
    updated[index] = value;
    updateField("risks", updated);
  };

  const removeRisk = (index: number) => {
    updateField(
      "risks",
      data.risks.filter((_, i) => i !== index),
    );
  };

  return (
    <div>
      <h2>{t("ed.supply.title")}</h2>
      <p className="text-base-content/70 text-sm mb-5">{t("ed.supply.desc")}</p>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">{t("ed.supply.risksLabel")}</span>
        </label>
        {data.risks.map((risk, idx) => (
          <div key={idx} className="flex gap-2.5 mb-2.5">
            <input
              type="text"
              placeholder={t("ed.supply.riskItem")}
              value={risk}
              onChange={(e) => updateRisk(idx, e.target.value)}
              className="input input-bordered flex-1"
            />
            <button className="btn btn-error btn-sm" onClick={() => removeRisk(idx)}>
              {t("common.remove")}
            </button>
          </div>
        ))}
        <button onClick={addRisk} className="btn btn-success btn-sm">
          <Plus size={16} className="mr-1" />
          {t("ed.supply.addRisk")}
        </button>
      </div>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">{t("ed.supply.assessmentLabel")}</span>
        </label>
        <AiTextarea
          aiLabel={t("ed.supply.assessmentLabel")}
          placeholder={t("ed.supply.assessmentPlaceholder")}
          value={data.assessment}
          onValueChange={(value) => updateField("assessment", value)}
          rows={4}
        />
      </div>

      <div className="alert alert-info mt-5">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>{t("ed.supply.tip")}</span>
      </div>
    </div>
  );
}
