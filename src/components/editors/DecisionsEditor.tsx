import { Decision } from "@/types";
import { createId } from "@/lib/reportFactory";
import { Plus } from "lucide-react";

interface DecisionsEditorProps {
  data: Decision[];
  onUpdate: (data: Decision[]) => void;
}

export default function DecisionsEditor({
  data,
  onUpdate,
}: DecisionsEditorProps) {
  const addDecision = () => {
    const newDecision: Decision = {
      id: createId("decision"),
      title: "",
      rationale: "",
      impact: "",
    };
    onUpdate([...data, newDecision]);
  };

  const updateDecision = (id: string, updates: Partial<Decision>) => {
    onUpdate(
      data.map((decision) =>
        decision.id === id ? { ...decision, ...updates } : decision
      )
    );
  };

  const deleteDecision = (id: string) => {
    onUpdate(data.filter((decision) => decision.id !== id));
  };

  return (
    <div>
      <h2>Decisions Required</h2>
      <p className="text-base-content/70 text-sm mb-5">
        Decisions requiring board or executive approval
      </p>

      <div className="flex flex-col gap-4 mb-4">
        {data.map((decision) => (
          <div key={decision.id} className="bg-base-200 border border-base-300 rounded p-4">
            <div className="flex gap-3 items-start">
              <input
                type="text"
                placeholder="Decision title"
                value={decision.title}
                onChange={(e) =>
                  updateDecision(decision.id, { title: e.target.value })
                }
                className="input input-bordered font-semibold text-base flex-1"
              />
              <button
                onClick={() => deleteDecision(decision.id)}
                className="btn btn-error btn-sm"
              >
                Delete
              </button>
            </div>

            <div className="mt-2.5 grid gap-2.5">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Rationale:</span>
                </label>
                <textarea
                  placeholder="Why is this decision needed? What's the business case?"
                  value={decision.rationale}
                  onChange={(e) =>
                    updateDecision(decision.id, { rationale: e.target.value })
                  }
                  rows={2}
                  className="textarea textarea-bordered w-full"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Impact:</span>
                </label>
                <textarea
                  placeholder="What happens if approved? What are the risks if not approved?"
                  value={decision.impact}
                  onChange={(e) =>
                    updateDecision(decision.id, { impact: e.target.value })
                  }
                  rows={2}
                  className="textarea textarea-bordered w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addDecision} className="btn btn-success mt-4">
        <Plus size={16} className="mr-1" />
        Add Decision
      </button>

      <div className="alert alert-info mt-5">
        <div>
          <span>Tip: Be clear and concise. Include approval timeline. Frame in business terms.</span>
        </div>
      </div>
    </div>
  );
}
