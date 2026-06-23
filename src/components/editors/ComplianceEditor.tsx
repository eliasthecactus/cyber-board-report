import { ComplianceAudit } from "@/types";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n";

interface ComplianceEditorProps {
  data: ComplianceAudit;
  onUpdate: (data: ComplianceAudit) => void;
}

export default function ComplianceEditor({
  data,
  onUpdate,
}: ComplianceEditorProps) {
  const t = useT();
  const updateField = <K extends keyof ComplianceAudit>(field: K, value: ComplianceAudit[K]) => {
    onUpdate({ ...data, [field]: value });
  };

  const addFinding = () => updateField("findings", [...data.findings, ""]);
  const updateFinding = (index: number, value: string) => {
    const updated = [...data.findings];
    updated[index] = value;
    updateField("findings", updated);
  };
  const removeFinding = (index: number) =>
    updateField("findings", data.findings.filter((_, i) => i !== index));

  const addGap = () => updateField("gaps", [...data.gaps, ""]);
  const updateGap = (index: number, value: string) => {
    const updated = [...data.gaps];
    updated[index] = value;
    updateField("gaps", updated);
  };
  const removeGap = (index: number) =>
    updateField("gaps", data.gaps.filter((_, i) => i !== index));

  return (
    <div>
      <h2>{t("ed.compliance.title")}</h2>
      <p className="text-base-content/70 text-sm mb-5">{t("ed.compliance.desc")}</p>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">{t("ed.compliance.statusLabel")}</span>
        </label>
        <select
          value={data.status}
          onChange={(e) => updateField("status", e.target.value as ComplianceAudit["status"])}
          className="select select-bordered w-full"
        >
          <option value="compliant">{t("ed.compliance.status.compliant")}</option>
          <option value="compliant-with-exceptions">{t("ed.compliance.status.exceptions")}</option>
          <option value="non-compliant">{t("ed.compliance.status.non")}</option>
        </select>
      </div>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">{t("ed.compliance.findingsLabel")}</span>
        </label>
        {data.findings.map((finding, idx) => (
          <div key={idx} className="flex gap-2.5 mb-2.5">
            <input
              type="text"
              placeholder={t("ed.compliance.findingItem")}
              value={finding}
              onChange={(e) => updateFinding(idx, e.target.value)}
              className="input input-bordered flex-1"
            />
            <button onClick={() => removeFinding(idx)} className="btn btn-error btn-sm">
              {t("common.remove")}
            </button>
          </div>
        ))}
        <button onClick={addFinding} className="btn btn-success btn-sm">
          <Plus size={16} className="mr-1" />
          {t("ed.compliance.addFinding")}
        </button>
      </div>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">{t("ed.compliance.gapsLabel")}</span>
        </label>
        {data.gaps.map((gap, idx) => (
          <div key={idx} className="flex gap-2.5 mb-2.5">
            <input
              type="text"
              placeholder={t("ed.compliance.gapItem")}
              value={gap}
              onChange={(e) => updateGap(idx, e.target.value)}
              className="input input-bordered flex-1"
            />
            <button onClick={() => removeGap(idx)} className="btn btn-error btn-sm">
              {t("common.remove")}
            </button>
          </div>
        ))}
        <button onClick={addGap} className="btn btn-success btn-sm">
          <Plus size={16} className="mr-1" />
          {t("ed.compliance.addGap")}
        </button>
      </div>

      <div className="alert alert-info mt-5">
        <div>
          <span>{t("ed.compliance.tip")}</span>
        </div>
      </div>
    </div>
  );
}
