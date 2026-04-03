import { Risk, Likelihood, Impact, Trend } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { Trash2 } from "lucide-react";

interface TopRisksEditorProps {
  data: Risk[];
  onUpdate: (data: Risk[]) => void;
}

export default function TopRisksEditor({ data, onUpdate }: TopRisksEditorProps) {
  const addRisk = () => {
    const newRisk: Risk = {
      id: uuidv4(),
      name: "",
      likelihood: "low",
      businessImpact: "low",
      trend: "stable",
      historicalData: [],
    };
    onUpdate([...data, newRisk]);
  };

  const updateRisk = (id: string, updates: Partial<Risk>) => {
    onUpdate(
      data.map((risk) => (risk.id === id ? { ...risk, ...updates } : risk))
    );
  };

  const deleteRisk = (id: string) => {
    onUpdate(data.filter((risk) => risk.id !== id));
  };

  return (
    <div>
      <h2>Top Risks</h2>
      <p className="text-base-content/70 text-sm mb-5">
        Up to 5 material security risks. Each with likelihood, impact, and trend.
      </p>

      <div className="flex flex-col gap-4 mb-4">
        {data.map((risk) => (
          <div
            key={risk.id}
            className="bg-base-200 border border-base-300 rounded p-4"
          >
            <div className="flex gap-3 items-center mb-3">
              <input
                type="text"
                placeholder="Risk name"
                value={risk.name}
                onChange={(e) => updateRisk(risk.id, { name: e.target.value })}
                className="input input-bordered font-semibold text-base flex-1"
              />
              <div className="flex gap-2 flex-wrap items-center">
                <select
                  value={risk.likelihood}
                  onChange={(e) =>
                    updateRisk(risk.id, { likelihood: e.target.value as Likelihood })
                  }
                  className="select select-bordered select-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>

                <select
                  value={risk.businessImpact}
                  onChange={(e) =>
                    updateRisk(risk.id, { businessImpact: e.target.value as Impact })
                  }
                  className="select select-bordered select-sm"
                >
                  <option value="low">Low Impact</option>
                  <option value="medium">Medium Impact</option>
                  <option value="high">High Impact</option>
                  <option value="critical">Critical Impact</option>
                </select>

                <select
                  value={risk.trend}
                  onChange={(e) =>
                    updateRisk(risk.id, { trend: e.target.value as Trend })
                  }
                  className="select select-bordered select-sm"
                >
                  <option value="improving">Improving</option>
                  <option value="stable">Stable</option>
                  <option value="worsening">Worsening</option>
                </select>

                <button
                  onClick={() => deleteRisk(risk.id)}
                  className="btn btn-sm btn-ghost text-error"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <textarea
              placeholder="Business impact description..."
              value={risk.description || ""}
              onChange={(e) => updateRisk(risk.id, { description: e.target.value })}
              rows={2}
              className="textarea textarea-bordered w-full"
            />
          </div>
        ))}
      </div>

      <button className="btn btn-success mt-4" onClick={addRisk}>
        Add Risk
      </button>

      <div className="alert alert-info mt-5">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Focus on 3-5 risks maximum. Each should be specific and measurable.</span>
      </div>
    </div>
  );
}
