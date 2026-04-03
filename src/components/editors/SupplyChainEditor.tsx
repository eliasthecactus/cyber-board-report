import { SupplyChainRisk } from "@/types";
import { Plus } from "lucide-react";

interface SupplyChainEditorProps {
  data: SupplyChainRisk;
  onUpdate: (data: SupplyChainRisk) => void;
}

export default function SupplyChainEditor({
  data,
  onUpdate,
}: SupplyChainEditorProps) {
  const updateField = (field: keyof SupplyChainRisk, value: any) => {
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
      data.risks.filter((_, i) => i !== index)
    );
  };

  return (
    <div>
      <h2>Third-Party / Supply Chain Risk</h2>
      <p className="text-base-content/70 text-sm mb-5">
        Vendor risks, third-party security posture, dependencies
      </p>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">Key Supply Chain Risks:</span>
        </label>
        {data.risks.map((risk, idx) => (
          <div key={idx} className="flex gap-2.5 mb-2.5">
            <input
              type="text"
              placeholder="Risk..."
              value={risk}
              onChange={(e) => updateRisk(idx, e.target.value)}
              className="input input-bordered flex-1"
            />
            <button className="btn btn-error btn-sm" onClick={() => removeRisk(idx)}>
              Remove
            </button>
          </div>
        ))}
        <button onClick={addRisk} className="btn btn-success btn-sm">
          <Plus size={16} className="mr-1" />
          Add Risk
        </button>
      </div>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">Overall Assessment:</span>
        </label>
        <textarea
          placeholder="Summary of third-party security program, vendor management, monitoring..."
          value={data.assessment}
          onChange={(e) => updateField("assessment", e.target.value)}
          rows={4}
          className="textarea textarea-bordered w-full"
        />
      </div>

      <div className="alert alert-info mt-5">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Highlight vendors with elevated risk or SLAs at risk.</span>
      </div>
    </div>
  );
}
