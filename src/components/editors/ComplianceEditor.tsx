import { ComplianceAudit } from "@/types";
import { Plus } from "lucide-react";

interface ComplianceEditorProps {
  data: ComplianceAudit;
  onUpdate: (data: ComplianceAudit) => void;
}

export default function ComplianceEditor({
  data,
  onUpdate,
}: ComplianceEditorProps) {
  const updateField = (field: keyof ComplianceAudit, value: any) => {
    onUpdate({ ...data, [field]: value });
  };

  const addFinding = () => {
    updateField("findings", [...data.findings, ""]);
  };

  const updateFinding = (index: number, value: string) => {
    const updated = [...data.findings];
    updated[index] = value;
    updateField("findings", updated);
  };

  const removeFinding = (index: number) => {
    updateField(
      "findings",
      data.findings.filter((_, i) => i !== index)
    );
  };

  const addGap = () => {
    updateField("gaps", [...data.gaps, ""]);
  };

  const updateGap = (index: number, value: string) => {
    const updated = [...data.gaps];
    updated[index] = value;
    updateField("gaps", updated);
  };

  const removeGap = (index: number) => {
    updateField(
      "gaps",
      data.gaps.filter((_, i) => i !== index)
    );
  };

  return (
    <div>
      <h2>Compliance & Audit Status</h2>
      <p className="text-base-content/70 text-sm mb-5">
        Compliance stance (SOC2, ISO, PCI, etc.), recent audit findings, and gaps
      </p>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">Compliance Status:</span>
        </label>
        <select
          value={data.status}
          onChange={(e) => updateField("status", e.target.value)}
          className="select select-bordered w-full"
        >
          <option value="compliant">Compliant</option>
          <option value="compliant-with-exceptions">Compliant with Exceptions</option>
          <option value="non-compliant">Non-Compliant</option>
        </select>
      </div>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">Audit Findings:</span>
        </label>
        {data.findings.map((finding, idx) => (
          <div key={idx} className="flex gap-2.5 mb-2.5">
            <input
              type="text"
              placeholder="Finding..."
              value={finding}
              onChange={(e) => updateFinding(idx, e.target.value)}
              className="input input-bordered flex-1"
            />
            <button
              onClick={() => removeFinding(idx)}
              className="btn btn-error btn-sm"
            >
              Remove
            </button>
          </div>
        ))}
        <button onClick={addFinding} className="btn btn-success btn-sm">
          <Plus size={16} className="mr-1" />
          Add Finding
        </button>
      </div>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">Compliance Gaps:</span>
        </label>
        {data.gaps.map((gap, idx) => (
          <div key={idx} className="flex gap-2.5 mb-2.5">
            <input
              type="text"
              placeholder="Gap..."
              value={gap}
              onChange={(e) => updateGap(idx, e.target.value)}
              className="input input-bordered flex-1"
            />
            <button
              onClick={() => removeGap(idx)}
              className="btn btn-error btn-sm"
            >
              Remove
            </button>
          </div>
        ))}
        <button onClick={addGap} className="btn btn-success btn-sm">
          <Plus size={16} className="mr-1" />
          Add Gap
        </button>
      </div>

      <div className="alert alert-info mt-5">
        <div>
          <span>Tip: List only material findings and gaps. If compliant with no findings, say so.</span>
        </div>
      </div>
    </div>
  );
}
