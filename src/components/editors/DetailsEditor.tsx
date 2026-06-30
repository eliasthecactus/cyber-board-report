import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n";

export interface ReportDetails {
  title: string;
  presenter: string;
  participants: string[];
}

interface DetailsEditorProps {
  data: ReportDetails;
  onUpdate: (patch: Partial<ReportDetails>) => void;
  presenterFallback: string;
}

export default function DetailsEditor({ data, onUpdate, presenterFallback }: DetailsEditorProps) {
  const t = useT();

  const updateParticipant = (index: number, value: string) => {
    const updated = [...data.participants];
    updated[index] = value;
    onUpdate({ participants: updated });
  };

  const addParticipant = () => onUpdate({ participants: [...data.participants, ""] });

  const removeParticipant = (index: number) =>
    onUpdate({ participants: data.participants.filter((_, i) => i !== index) });

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{t("ed.details.title")}</h2>
      <p className="text-sm text-slate-500 mb-5">{t("ed.details.desc")}</p>

      <div className="mb-5">
        <label>
          <span className="text-sm font-medium text-slate-700">{t("ed.details.titleLabel")}</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder={t("report.defaultTitle")}
          className="form-input w-full"
        />
        <p className="mt-1 text-xs text-slate-400">{t("ed.details.titleHint")}</p>
      </div>

      <div className="mb-5">
        <label>
          <span className="text-sm font-medium text-slate-700">{t("ed.details.presenterLabel")}</span>
        </label>
        <input
          type="text"
          value={data.presenter}
          onChange={(e) => onUpdate({ presenter: e.target.value })}
          placeholder={presenterFallback || t("ed.details.presenterPlaceholder")}
          className="form-input w-full"
        />
        <p className="mt-1 text-xs text-slate-400">{t("ed.details.presenterHint")}</p>
      </div>

      <div className="mb-5">
        <label>
          <span className="text-sm font-medium text-slate-700">{t("ed.details.participantsLabel")}</span>
        </label>
        {data.participants.length === 0 ? (
          <p className="mb-2.5 text-sm text-slate-400">{t("ed.details.participantsEmpty")}</p>
        ) : (
          data.participants.map((participant, idx) => (
            <div key={idx} className="flex gap-2.5 mb-2.5">
              <input
                type="text"
                placeholder={t("ed.details.participantPlaceholder")}
                value={participant}
                onChange={(e) => updateParticipant(idx, e.target.value)}
                className="form-input flex-1"
              />
              <button
                onClick={() => removeParticipant(idx)}
                className="cbr-btn cbr-btn-danger cbr-btn-sm"
              >
                {t("common.remove")}
              </button>
            </div>
          ))
        )}
        <button onClick={addParticipant} className="cbr-btn cbr-btn-primary cbr-btn-sm">
          <Plus size={16} className="mr-1" />
          {t("ed.details.addParticipant")}
        </button>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mt-5">
        <span>{t("ed.details.tip")}</span>
      </div>
    </div>
  );
}
