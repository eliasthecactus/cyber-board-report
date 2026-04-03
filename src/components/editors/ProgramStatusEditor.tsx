import { ProgramStatus as ProgramStatusType } from "@/types";
import { Plus } from "lucide-react";

interface ProgramStatusEditorProps {
  data: ProgramStatusType;
  onUpdate: (data: ProgramStatusType) => void;
}

export default function ProgramStatusEditor({
  data,
  onUpdate,
}: ProgramStatusEditorProps) {
  const updateField = (field: "status" | "achievements" | "challenges", value: any) => {
    onUpdate({ ...data, [field]: value });
  };

  const addAchievement = () => {
    updateField("achievements", [...data.achievements, ""]);
  };

  const updateAchievement = (index: number, value: string) => {
    const updated = [...data.achievements];
    updated[index] = value;
    updateField("achievements", updated);
  };

  const removeAchievement = (index: number) => {
    updateField(
      "achievements",
      data.achievements.filter((_, i) => i !== index)
    );
  };

  const addChallenge = () => {
    updateField("challenges", [...data.challenges, ""]);
  };

  const updateChallenge = (index: number, value: string) => {
    const updated = [...data.challenges];
    updated[index] = value;
    updateField("challenges", updated);
  };

  const removeChallenge = (index: number) => {
    updateField(
      "challenges",
      data.challenges.filter((_, i) => i !== index)
    );
  };

  return (
    <div>
      <h2>Security Program Status</h2>
      <p className="text-base-content/70 text-sm mb-5">
        Overall program health, key achievements, and challenges
      </p>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">Program Status:</span>
        </label>
        <select
          value={data.status}
          onChange={(e) => updateField("status", e.target.value)}
          className="select select-bordered w-full"
        >
          <option value="on-track">On Track</option>
          <option value="at-risk">At Risk</option>
          <option value="at-critical-juncture">At Critical Juncture</option>
        </select>
      </div>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">Key Achievements:</span>
        </label>
        {data.achievements.map((achievement, idx) => (
          <div key={idx} className="flex gap-2.5 mb-2.5">
            <input
              type="text"
              placeholder="Achievement..."
              value={achievement}
              onChange={(e) => updateAchievement(idx, e.target.value)}
              className="input input-bordered flex-1"
            />
            <button
              onClick={() => removeAchievement(idx)}
              className="btn btn-error btn-sm"
            >
              Remove
            </button>
          </div>
        ))}
        <button onClick={addAchievement} className="btn btn-success btn-sm">
          <Plus size={16} className="mr-1" />
          Add Achievement
        </button>
      </div>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">Key Challenges:</span>
        </label>
        {data.challenges.map((challenge, idx) => (
          <div key={idx} className="flex gap-2.5 mb-2.5">
            <input
              type="text"
              placeholder="Challenge..."
              value={challenge}
              onChange={(e) => updateChallenge(idx, e.target.value)}
              className="input input-bordered flex-1"
            />
            <button
              onClick={() => removeChallenge(idx)}
              className="btn btn-error btn-sm"
            >
              Remove
            </button>
          </div>
        ))}
        <button onClick={addChallenge} className="btn btn-success btn-sm">
          <Plus size={16} className="mr-1" />
          Add Challenge
        </button>
      </div>

      <div className="alert alert-info mt-5">
        <div>
          <span>Tip: 3-4 achievements and challenges each. Focus on strategic relevance.</span>
        </div>
      </div>
    </div>
  );
}
