import { Incident } from "@/types";
import { createId } from "@/lib/reportFactory";
import { AiTextarea } from "@/components/ui/AiTextarea";
import { useT } from "@/lib/i18n";

interface IncidentsEditorProps {
  data: Incident[];
  onUpdate: (data: Incident[]) => void;
}

export default function IncidentsEditor({
  data,
  onUpdate,
}: IncidentsEditorProps) {
  const t = useT();
  const addIncident = () => {
    const newIncident: Incident = {
      id: createId("incident"),
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
        incident.id === id ? { ...incident, ...updates } : incident,
      ),
    );
  };

  const deleteIncident = (id: string) => {
    onUpdate(data.filter((incident) => incident.id !== id));
  };

  // What the AI knows about this specific incident, so each field it drafts
  // stays consistent with the title, severity and the other fields.
  const incidentAiContext = (incident: Incident): string =>
    [
      incident.title.trim() && `${t("ed.inc.titlePlaceholder")}: ${incident.title.trim()}`,
      incident.severity && `${t("ed.risks.impact")}: ${t(`ed.inc.severity.${incident.severity}`)}`,
      incident.businessImpact.trim() &&
        `${t("ed.inc.impactLabel")} ${incident.businessImpact.trim()}`,
      incident.outcome.trim() && `${t("ed.inc.outcomeLabel")} ${incident.outcome.trim()}`,
      incident.lessonsLearned.trim() &&
        `${t("ed.inc.lessonsLabel")} ${incident.lessonsLearned.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{t("ed.inc.title")}</h2>
      <p className="text-sm text-slate-500 mb-5">{t("ed.inc.desc")}</p>

      <div className="flex flex-col gap-4 mb-4">
        {data.map((incident) => (
          <div key={incident.id} className="bg-slate-50 border border-slate-200 rounded p-4">
            <div>
              <input
                type="text"
                placeholder={t("ed.inc.titlePlaceholder")}
                value={incident.title}
                onChange={(e) => updateIncident(incident.id, { title: e.target.value })}
                className="form-input font-semibold text-base w-full mb-2"
              />

              <div className="flex items-center gap-3">
                <select
                  value={incident.severity || "medium"}
                  onChange={(e) =>
                    updateIncident(incident.id, { severity: e.target.value as Incident["severity"] })
                  }
                  className="form-input w-36"
                >
                  <option value="low">{t("ed.inc.severity.low")}</option>
                  <option value="medium">{t("ed.inc.severity.medium")}</option>
                  <option value="high">{t("ed.inc.severity.high")}</option>
                  <option value="critical">{t("ed.inc.severity.critical")}</option>
                </select>

                <div className="ml-auto">
                  <button
                    onClick={() => deleteIncident(incident.id)}
                    className="cbr-btn cbr-btn-danger cbr-btn-sm"
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-2.5 grid gap-2.5">
              <div>
                <label>
                  <span className="text-sm font-medium text-slate-700 font-semibold">{t("ed.inc.impactLabel")}</span>
                </label>
                <AiTextarea
                  aiLabel={t("ed.inc.impactLabel")}
                  aiContext={incidentAiContext(incident)}
                  placeholder={t("ed.inc.impactPlaceholder")}
                  value={incident.businessImpact}
                  onValueChange={(value) =>
                    updateIncident(incident.id, { businessImpact: value })
                  }
                  rows={2}
                />
              </div>

              <div>
                <label>
                  <span className="text-sm font-medium text-slate-700 font-semibold">{t("ed.inc.outcomeLabel")}</span>
                </label>
                <AiTextarea
                  aiLabel={t("ed.inc.outcomeLabel")}
                  aiContext={incidentAiContext(incident)}
                  placeholder={t("ed.inc.outcomePlaceholder")}
                  value={incident.outcome}
                  onValueChange={(value) => updateIncident(incident.id, { outcome: value })}
                  rows={2}
                />
              </div>

              <div>
                <label>
                  <span className="text-sm font-medium text-slate-700 font-semibold">{t("ed.inc.lessonsLabel")}</span>
                </label>
                <AiTextarea
                  aiLabel={t("ed.inc.lessonsLabel")}
                  aiContext={incidentAiContext(incident)}
                  placeholder={t("ed.inc.lessonsPlaceholder")}
                  value={incident.lessonsLearned}
                  onValueChange={(value) =>
                    updateIncident(incident.id, { lessonsLearned: value })
                  }
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addIncident} className="cbr-btn cbr-btn-primary mt-4">
        {t("ed.inc.add")}
      </button>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mt-5">
        <div>
          <span>{t("ed.inc.tip")}</span>
        </div>
      </div>
    </div>
  );
}
