import { Initiative, InitiativeStatus } from "@/types";
import { createId } from "@/lib/reportFactory";
import { AiTextarea } from "@/components/ui/AiTextarea";
import { useT } from "@/lib/i18n";

interface InitiativesEditorProps {
  data: Initiative[];
  onUpdate: (data: Initiative[]) => void;
}

export default function InitiativesEditor({
  data,
  onUpdate,
}: InitiativesEditorProps) {
  const t = useT();
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
    onUpdate(data.map((init) => (init.id === id ? { ...init, ...updates } : init)));
  };

  const deleteInitiative = (id: string) => {
    onUpdate(data.filter((init) => init.id !== id));
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{t("ed.init.title")}</h2>
      <p className="text-sm text-slate-500 mb-5">{t("ed.init.desc")}</p>

      <div className="flex flex-col gap-4 mb-4">
        {data.map((initiative) => (
          <div key={initiative.id} className="bg-slate-50 border border-slate-200 rounded p-4">
            <div className="flex gap-3 items-start">
              <input
                type="text"
                placeholder={t("ed.init.namePlaceholder")}
                value={initiative.name}
                onChange={(e) => updateInitiative(initiative.id, { name: e.target.value })}
                className="form-input font-semibold text-base flex-1"
              />
              <button
                onClick={() => deleteInitiative(initiative.id)}
                className="cbr-btn cbr-btn-danger cbr-btn-sm"
              >
                {t("common.delete")}
              </button>
            </div>

            <div className="mt-2.5 grid gap-2.5">
              <div>
                <label>
                  <span className="text-sm font-medium text-slate-700 font-semibold">{t("ed.init.status")}</span>
                </label>
                <select
                  value={initiative.status}
                  onChange={(e) =>
                    updateInitiative(initiative.id, {
                      status: e.target.value as InitiativeStatus,
                    })
                  }
                  className="form-input w-full"
                >
                  <option value="on-track">{t("ed.init.status.onTrack")}</option>
                  <option value="at-risk">{t("ed.init.status.atRisk")}</option>
                  <option value="delayed">{t("ed.init.status.delayed")}</option>
                </select>
              </div>

              <div>
                <label>
                  <span className="text-sm font-medium text-slate-700 font-semibold">
                    {t("ed.init.progressLabel", { value: initiative.progress })}
                  </span>
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
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label>
                  <span className="text-sm font-medium text-slate-700 font-semibold">{t("ed.init.statusNoteLabel")}</span>
                </label>
                <AiTextarea
                  aiLabel={t("ed.init.statusNoteLabel")}
                  placeholder={t("ed.init.statusNotePlaceholder")}
                  value={initiative.statusNote || ""}
                  onValueChange={(value) => updateInitiative(initiative.id, { statusNote: value })}
                  rows={2}
                />
              </div>

              <div>
                <label>
                  <span className="text-sm font-medium text-slate-700 font-semibold">{t("ed.init.blockersOptional")}</span>
                </label>
                <AiTextarea
                  aiLabel={t("ed.init.blockersLabel")}
                  placeholder={t("ed.init.blockersPlaceholder")}
                  value={initiative.blockers || ""}
                  onValueChange={(value) => updateInitiative(initiative.id, { blockers: value })}
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addInitiative} className="cbr-btn cbr-btn-primary mt-4">
        {t("ed.init.add")}
      </button>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mt-5">
        <div>
          <span>{t("ed.init.tip")}</span>
        </div>
      </div>
    </div>
  );
}
