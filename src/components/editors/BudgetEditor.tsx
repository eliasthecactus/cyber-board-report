import { BudgetResources } from "@/types";

interface BudgetEditorProps {
  data: BudgetResources;
  onUpdate: (data: BudgetResources) => void;
}

export default function BudgetEditor({ data, onUpdate }: BudgetEditorProps) {
  const updateField = (field: keyof BudgetResources, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div>
      <h2>Budget & Resources</h2>
      <p className="text-base-content/60 text-sm mb-5">
        Approved budget, allocation, and resource constraints
      </p>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">Annual Budget:</span>
        </label>
        <textarea
          placeholder="e.g., $5M approved, breakdown by: people, tools, infrastructure"
          value={data.budget}
          onChange={(e) => updateField("budget", e.target.value)}
          rows={3}
          className="textarea textarea-bordered w-full"
        />
      </div>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">Allocation & Staffing:</span>
        </label>
        <textarea
          placeholder="e.g., 30 FTE, hiring status, key positions filled/unfilled"
          value={data.allocation}
          onChange={(e) => updateField("allocation", e.target.value)}
          rows={3}
          className="textarea textarea-bordered w-full"
        />
      </div>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">Resource Constraints:</span>
        </label>
        <textarea
          placeholder="e.g., skills gap, tool limitations, budget cuts needed"
          value={data.constraints}
          onChange={(e) => updateField("constraints", e.target.value)}
          rows={3}
          className="textarea textarea-bordered w-full"
        />
      </div>

      <div className="alert alert-info mt-5">
        <div>
          <span>Tip: Be specific with numbers. Then highlight constraints that block initiatives.</span>
        </div>
      </div>
    </div>
  );
}
