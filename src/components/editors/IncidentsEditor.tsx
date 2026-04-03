import { Incident } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface IncidentsEditorProps {
  data: Incident[];
  onUpdate: (data: Incident[]) => void;
}

export default function IncidentsEditor({
  data,
  onUpdate,
}: IncidentsEditorProps) {
  const addIncident = () => {
    const newIncident: Incident = {
      id: uuidv4(),
      title: "",
      businessImpact: "",
      outcome: "",
      lessonsLearned: "",
      quarter: new Date().getFullYear() + "-Q1",
    };
    onUpdate([...data, newIncident]);
  };

  const updateIncident = (id: string, updates: Partial<Incident>) => {
    onUpdate(
      data.map((incident) =>
        incident.id === id ? { ...incident, ...updates } : incident
      )
    );
  };

  const deleteIncident = (id: string) => {
    onUpdate(data.filter((incident) => incident.id !== id));
  };

  return (
    <div>
      <h2>Incidents & Lessons Learned</h2>
      <p className="text-base-content/70 text-sm mb-5">
        Major incidents from the quarter with business impact and outcomes
      </p>

      <div className="flex flex-col gap-4 mb-4">
        {data.map((incident) => (
          <div key={incident.id} className="bg-base-200 border border-base-300 rounded p-4">
            <div className="flex gap-3 items-start">
              <input
                type="text"
                placeholder="Incident title"
                value={incident.title}
                onChange={(e) =>
                  updateIncident(incident.id, { title: e.target.value })
                }
                className="input input-bordered font-semibold text-base flex-1"
              />
              <select
                value={incident.severity || "medium"}
                onChange={(e) =>
                  updateIncident(incident.id, { severity: e.target.value as Incident["severity"] })
                }
                className="select select-bordered w-36"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <button
                onClick={() => deleteIncident(incident.id)}
                className="btn btn-error btn-sm"
              >
                Delete
              </button>
            </div>

            <div className="mt-2.5 grid gap-2.5">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Business Impact:</span>
                </label>
                <textarea
                  placeholder="How did this affect the business?"
                  value={incident.businessImpact}
                  onChange={(e) =>
                    updateIncident(incident.id, { businessImpact: e.target.value })
                  }
                  rows={2}
                  className="textarea textarea-bordered w-full"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Outcome:</span>
                </label>
                <textarea
                  placeholder="How was it resolved?"
                  value={incident.outcome}
                  onChange={(e) =>
                    updateIncident(incident.id, { outcome: e.target.value })
                  }
                  rows={2}
                  className="textarea textarea-bordered w-full"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Lessons Learned:</span>
                </label>
                <textarea
                  placeholder="What did we learn? What will we do differently?"
                  value={incident.lessonsLearned}
                  onChange={(e) =>
                    updateIncident(incident.id, { lessonsLearned: e.target.value })
                  }
                  rows={2}
                  className="textarea textarea-bordered w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addIncident} className="btn btn-success mt-4">
        Add Incident
      </button>

      <div className="alert alert-info mt-5">
        <div>
          <span>Tip: Keep descriptions business-focused. No technical jargon.</span>
        </div>
      </div>
    </div>
  );
}
