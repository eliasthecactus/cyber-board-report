import { useState } from "react";
import { formatDateTime, useLanguage, useT } from "@/lib/i18n";
import type { ConflictResolution, ReportConflict } from "@/lib/storage";
import { Modal } from "@/components/ui/Modal";

const RESOLUTIONS: readonly ConflictResolution[] = ["overwrite", "skip", "keepBoth"];

interface ImportConflictDialogProps {
  conflicts: ReportConflict[];
  onCancel: () => void;
  onConfirm: (resolutions: Record<number, ConflictResolution>) => void;
}

/** Asks, per imported report, what to do when its quarter already has a different report. */
export function ImportConflictDialog({ conflicts, onCancel, onConfirm }: ImportConflictDialogProps) {
  const t = useT();
  const lang = useLanguage();
  const [resolutions, setResolutions] = useState<Record<number, ConflictResolution>>({});
  const complete = conflicts.every((conflict) => resolutions[conflict.index]);

  const setAll = (resolution: ConflictResolution) =>
    setResolutions(Object.fromEntries(conflicts.map((conflict) => [conflict.index, resolution])));

  return (
    <Modal
      title={t("backup.conflictTitle")}
      description={t("backup.conflictDesc", { count: conflicts.length })}
      onClose={onCancel}
      className="max-w-lg"
    >
      {conflicts.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{t("backup.conflictApplyAll")}</span>
          {RESOLUTIONS.map((resolution) => (
            <button
              key={resolution}
              type="button"
              className="cbr-btn cbr-btn-outline cbr-btn-xs"
              onClick={() => setAll(resolution)}
            >
              {t(`backup.conflict.${resolution}`)}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {conflicts.map((conflict) => (
          <fieldset key={conflict.index} className="rounded-lg border border-slate-200 p-3">
            <legend className="px-1 text-sm font-semibold text-slate-800">
              {conflict.quarter} {conflict.year}
            </legend>
            <p className="mb-2 text-xs text-slate-500">
              {t("backup.conflictExisting", { date: formatDateTime(conflict.existing.updatedAt, lang) })}
              <br />
              {t("backup.conflictIncoming", { date: formatDateTime(conflict.incoming.updatedAt, lang) })}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {RESOLUTIONS.map((resolution) => (
                <label key={resolution} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name={`conflict-${conflict.index}`}
                    className="h-4 w-4 accent-primary"
                    checked={resolutions[conflict.index] === resolution}
                    onChange={() => setResolutions({ ...resolutions, [conflict.index]: resolution })}
                  />
                  {t(`backup.conflict.${resolution}`)}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="cbr-btn cbr-btn-ghost" onClick={onCancel}>
          {t("common.cancel")}
        </button>
        <button
          type="button"
          className="cbr-btn cbr-btn-primary"
          onClick={() => onConfirm(resolutions)}
          disabled={!complete}
        >
          {t("backup.import")}
        </button>
      </div>
    </Modal>
  );
}
