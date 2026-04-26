import { Initiative, InitiativeStatus } from "@/types";
import { createId } from "@/lib/reportFactory";

interface InitiativesEditorProps {
  data: Initiative[];
  onUpdate: (data: Initiative[]) => void;
}

export default function InitiativesEditor({
  data,
  onUpdate,
}: InitiativesEditorProps) {
  const addInitiative = () => {
    const newInitiative: Initiative = {
      id: createId("initiative"),
      name: "",
      status: "on-track",
      progress: 0,
    };
    onUpdate([...data, newInitiative]);
  };

  const updateInitiative = (id: string, updates: Partial<Initiative>) => {
    onUpdate(
      data.map((init) => (init.id === id ? { ...init, ...updates } : init))
    );
  };

  const deleteInitiative = (id: string) => {
    onUpdate(data.filter((init) => init.id !== id));
  };

  return (
    <div>
      <h2>Security Initiatives</h2>
      <p className="text-base-content/70 text-sm mb-5">
        Major security programs and their status/progress
      </p>

      <div className="flex flex-col gap-4 mb-4">
        {data.map((initiative) => (
          <div key={initiative.id} className="bg-base-200 border border-base-300 rounded p-4">
            <div className="flex gap-3 items-start">
              <input
                type="text"
                placeholder="Initiative name"
                value={initiative.name}
                onChange={(e) =>
                  updateInitiative(initiative.id, { name: e.target.value })
                }
                className="input input-bordered font-semibold text-base flex-1"
              />
              <button
                onClick={() => deleteInitiative(initiative.id)}
                className="btn btn-error btn-sm"
              >
                Delete
              </button>
            </div>

            <div className="mt-2.5 grid gap-2.5">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Status:</span>
                </label>
                <select
                  value={initiative.status}
                  onChange={(e) =>
                    updateInitiative(initiative.id, {
                      status: e.target.value as InitiativeStatus,
                    })
                  }
                  className="select select-bordered w-full"
                >
                  <option value="on-track">On Track</option>
                  <option value="at-risk">At Risk</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Progress: {initiative.progress}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={initiative.progress}
                  onChange={(e) =>
                    updateInitiative(initiative.id, {
                      progress: parseInt(e.target.value),
                    })
                  }
                  className="range range-sm w-full"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Blockers (if any):</span>
                </label>
                <textarea
                  placeholder="Budget delays, resource constraints, technical challenges..."
                  value={initiative.blockers || ""}
                  onChange={(e) =>
                    updateInitiative(initiative.id, { blockers: e.target.value })
                  }
                  rows={2}
                  className="textarea textarea-bordered w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addInitiative} className="btn btn-success mt-4">
        Add Initiative
      </button>

      <div className="alert alert-info mt-5">
        <div>
          <span>Tip: Focus on strategic initiatives. Name them clearly. If delayed, explain why.</span>
        </div>
      </div>
    </div>
  );
}
