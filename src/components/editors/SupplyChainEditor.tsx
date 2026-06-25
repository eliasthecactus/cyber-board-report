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
      <h2 className="text-lg font-semibold text-slate-900">{t("ed.supply.title")}</h2>
      <p className="text-sm text-slate-500 mb-5">{t("ed.supply.desc")}</p>

      <div className="mb-5">
        <label>
          <span className="text-sm font-medium text-slate-700">{t("ed.supply.risksLabel")}</span>
        </label>
        {data.risks.map((risk, idx) => (
          <div key={idx} className="flex gap-2.5 mb-2.5">
            <input
              type="text"
              placeholder={t("ed.supply.riskItem")}
              value={risk}
              onChange={(e) => updateRisk(idx, e.target.value)}
              className="form-input flex-1"
            />
            <button className="cbr-btn cbr-btn-danger cbr-btn-sm" onClick={() => removeRisk(idx)}>
              {t("common.remove")}
            </button>
          </div>
        ))}
        <button onClick={addRisk} className="cbr-btn cbr-btn-primary cbr-btn-sm">
          <Plus size={16} className="mr-1" />
          {t("ed.supply.addRisk")}
        </button>
      </div>

      <div className="mb-5">
        <label>
          <span className="text-sm font-medium text-slate-700">{t("ed.supply.assessmentLabel")}</span>
        </label>
        <AiTextarea
          aiLabel={t("ed.supply.assessmentLabel")}
          placeholder={t("ed.supply.assessmentPlaceholder")}
          value={data.assessment}
          onValueChange={(value) => updateField("assessment", value)}
          rows={4}
        />
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mt-5">
        <span>{t("ed.supply.tip")}</span>
      </div>
    </div>
  );
}
