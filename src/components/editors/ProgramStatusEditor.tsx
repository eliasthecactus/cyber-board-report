import { ProgramStatus as ProgramStatusType } from "@/types";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n";

interface ProgramStatusEditorProps {
  data: ProgramStatusType;
  onUpdate: (data: ProgramStatusType) => void;
}

export default function ProgramStatusEditor({
  data,
  onUpdate,
}: ProgramStatusEditorProps) {
  const t = useT();
  const updateField = <K extends keyof ProgramStatusType>(
    field: K,
    value: ProgramStatusType[K],
  ) => {
    onUpdate({ ...data, [field]: value });
  };

  const addAchievement = () => updateField("achievements", [...data.achievements, ""]);
  const updateAchievement = (index: number, value: string) => {
    const updated = [...data.achievements];
    updated[index] = value;
    updateField("achievements", updated);
  };
  const removeAchievement = (index: number) =>
    updateField("achievements", data.achievements.filter((_, i) => i !== index));

  const addChallenge = () => updateField("challenges", [...data.challenges, ""]);
  const updateChallenge = (index: number, value: string) => {
    const updated = [...data.challenges];
    updated[index] = value;
    updateField("challenges", updated);
  };
  const removeChallenge = (index: number) =>
    updateField("challenges", data.challenges.filter((_, i) => i !== index));

  return (
    <div>
      <h2>{t("ed.program.title")}</h2>
      <p className="text-base-content/70 text-sm mb-5">{t("ed.program.desc")}</p>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">{t("ed.program.statusLabel")}</span>
        </label>
        <select
          value={data.status}
          onChange={(e) => updateField("status", e.target.value as ProgramStatusType["status"])}
          className="select select-bordered w-full"
        >
          <option value="on-track">{t("ed.program.status.onTrack")}</option>
          <option value="at-risk">{t("ed.program.status.atRisk")}</option>
          <option value="at-critical-juncture">{t("ed.program.status.critical")}</option>
        </select>
      </div>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">{t("ed.program.achievementsLabel")}</span>
        </label>
        {data.achievements.map((achievement, idx) => (
          <div key={idx} className="flex gap-2.5 mb-2.5">
            <input
              type="text"
              placeholder={t("ed.program.achievementItem")}
              value={achievement}
              onChange={(e) => updateAchievement(idx, e.target.value)}
              className="input input-bordered flex-1"
            />
            <button onClick={() => removeAchievement(idx)} className="btn btn-error btn-sm">
              {t("common.remove")}
            </button>
          </div>
        ))}
        <button onClick={addAchievement} className="btn btn-success btn-sm">
          <Plus size={16} className="mr-1" />
          {t("ed.program.addAchievement")}
        </button>
      </div>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">{t("ed.program.challengesLabel")}</span>
        </label>
        {data.challenges.map((challenge, idx) => (
          <div key={idx} className="flex gap-2.5 mb-2.5">
            <input
              type="text"
              placeholder={t("ed.program.challengeItem")}
              value={challenge}
              onChange={(e) => updateChallenge(idx, e.target.value)}
              className="input input-bordered flex-1"
            />
            <button onClick={() => removeChallenge(idx)} className="btn btn-error btn-sm">
              {t("common.remove")}
            </button>
          </div>
        ))}
        <button onClick={addChallenge} className="btn btn-success btn-sm">
          <Plus size={16} className="mr-1" />
          {t("ed.program.addChallenge")}
        </button>
      </div>

      <div className="alert alert-info mt-5">
        <div>
          <span>{t("ed.program.tip")}</span>
        </div>
      </div>
    </div>
  );
}
