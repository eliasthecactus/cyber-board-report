import { useId } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n";

export interface ReportDetails {
  title: string;
  presenter: string;
  participants: string[];
  hideEmptySlides: boolean;
}

interface DetailsEditorProps {
  data: ReportDetails;
  onUpdate: (patch: Partial<ReportDetails>) => void;
  presenterFallback: string;
}

export default function DetailsEditor({ data, onUpdate, presenterFallback }: DetailsEditorProps) {
  const t = useT();
  const id = useId();

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
        <label htmlFor={`${id}-title`} className="text-sm font-medium text-slate-700">
          {t("ed.details.titleLabel")}
        </label>
        <input
          id={`${id}-title`}
          type="text"
          value={data.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder={t("report.defaultTitle")}
          className="form-input w-full"
          aria-describedby={`${id}-title-hint`}
        />
        <p id={`${id}-title-hint`} className="mt-1 text-xs text-slate-500">
          {t("ed.details.titleHint")}
        </p>
      </div>

      <div className="mb-5">
        <label htmlFor={`${id}-presenter`} className="text-sm font-medium text-slate-700">
          {t("ed.details.presenterLabel")}
        </label>
        <input
          id={`${id}-presenter`}
          type="text"
          value={data.presenter}
          onChange={(e) => onUpdate({ presenter: e.target.value })}
          placeholder={presenterFallback || t("ed.details.presenterPlaceholder")}
          className="form-input w-full"
          aria-describedby={`${id}-presenter-hint`}
        />
        <p id={`${id}-presenter-hint`} className="mt-1 text-xs text-slate-500">
          {t("ed.details.presenterHint")}
        </p>
      </div>

      <fieldset className="mb-5">
        <legend className="text-sm font-medium text-slate-700">{t("ed.details.participantsLabel")}</legend>
        {data.participants.length === 0 ? (
          <p className="mb-2.5 text-sm text-slate-500">{t("ed.details.participantsEmpty")}</p>
        ) : (
          data.participants.map((participant, idx) => (
            <div key={idx} className="flex gap-2.5 mb-2.5">
              <input
                type="text"
                aria-label={t("ed.details.participantNumber", { number: idx + 1 })}
                placeholder={t("ed.details.participantPlaceholder")}
                value={participant}
                onChange={(e) => updateParticipant(idx, e.target.value)}
                className="form-input flex-1"
              />
              <button
                onClick={() => removeParticipant(idx)}
                className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon text-red-500"
                aria-label={t("ed.details.removeParticipant", { name: participant || idx + 1 })}
                title={t("common.remove")}
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </div>
          ))
        )}
        <button onClick={addParticipant} className="cbr-btn cbr-btn-primary cbr-btn-sm">
          <Plus size={16} aria-hidden />
          {t("ed.details.addParticipant")}
        </button>
      </fieldset>

      <label className="mb-5 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <input
          type="checkbox"
          checked={data.hideEmptySlides}
          onChange={(e) => onUpdate({ hideEmptySlides: e.target.checked })}
          className="h-4 w-4 shrink-0 accent-primary"
        />
        <span>
          <span className="block text-sm font-medium text-slate-700">{t("ed.details.hideEmpty")}</span>
          <span className="block text-xs text-slate-500">{t("ed.details.hideEmptyDesc")}</span>
        </span>
      </label>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mt-5">
        <span>{t("ed.details.tip")}</span>
      </div>
    </div>
  );
}
