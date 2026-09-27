import { Decision } from "@/types";
import { createId } from "@/lib/reportFactory";
import { Plus, Trash2 } from "lucide-react";
import { AiTextarea } from "@/components/ui/AiTextarea";
import { useT } from "@/lib/i18n";

interface DecisionsEditorProps {
  data: Decision[];
  onUpdate: (data: Decision[]) => void;
}

export default function DecisionsEditor({
  data,
  onUpdate,
}: DecisionsEditorProps) {
  const t = useT();
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
      data.map((decision) => (decision.id === id ? { ...decision, ...updates } : decision)),
    );
  };

  const deleteDecision = (id: string) => {
    onUpdate(data.filter((decision) => decision.id !== id));
  };

  // Facts about this specific decision so the AI keeps rationale and impact
  // consistent with the decision title and with each other.
  const decisionAiContext = (decision: Decision): string =>
    [
      decision.title.trim() && `${t("ed.dec.titleLabel")}: ${decision.title.trim()}`,
      decision.rationale.trim() && `${t("ed.dec.rationaleLabel")} ${decision.rationale.trim()}`,
      decision.impact.trim() && `${t("ed.dec.impactLabel")} ${decision.impact.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{t("ed.dec.title")}</h2>
      <p className="text-sm text-slate-500 mb-5">{t("ed.dec.desc")}</p>

      <div className="flex flex-col gap-4 mb-4">
        {data.map((decision) => (
          <div key={decision.id} className="bg-slate-50 border border-slate-200 rounded p-4">
            <div className="flex gap-3 items-start">
              <input
                type="text"
                placeholder={t("ed.dec.titlePlaceholder")}
                aria-label={t("ed.dec.titleLabel")}
                value={decision.title}
                onChange={(e) => updateDecision(decision.id, { title: e.target.value })}
                className="form-input font-semibold text-base flex-1"
              />
              <button
                onClick={() => deleteDecision(decision.id)}
                className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon shrink-0 text-red-500"
                aria-label={t("common.deleteNamed", { name: decision.title || t("ed.item.untitled") })}
                title={t("common.delete")}
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </div>

            <div className="mt-2.5 grid gap-2.5">
              <div>
                <span className="text-sm font-semibold text-slate-700" aria-hidden>{t("ed.dec.rationaleLabel")}</span>
                <AiTextarea
                  aiLabel={t("ed.dec.rationaleLabel")}
                  aria-label={t("ed.dec.rationaleLabel")}
                  aiContext={decisionAiContext(decision)}
                  placeholder={t("ed.dec.rationalePlaceholder")}
                  value={decision.rationale}
                  onValueChange={(value) => updateDecision(decision.id, { rationale: value })}
                  rows={2}
                />
              </div>

              <div>
                <span className="text-sm font-semibold text-slate-700" aria-hidden>{t("ed.dec.impactLabel")}</span>
                <AiTextarea
                  aiLabel={t("ed.dec.impactLabel")}
                  aria-label={t("ed.dec.impactLabel")}
                  aiContext={decisionAiContext(decision)}
                  placeholder={t("ed.dec.impactPlaceholder")}
                  value={decision.impact}
                  onValueChange={(value) => updateDecision(decision.id, { impact: value })}
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addDecision} className="cbr-btn cbr-btn-primary mt-4">
        <Plus size={16} aria-hidden />
        {t("ed.dec.add")}
      </button>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mt-5">
        <div>
          <span>{t("ed.dec.tip")}</span>
        </div>
      </div>
    </div>
  );
}
