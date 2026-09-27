import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { SnapshotSelection } from "@/lib/storage";
import { Modal } from "@/components/ui/Modal";

export interface SelectionRow {
  key: keyof SnapshotSelection;
  label: string;
  hint: string;
  available: boolean;
  /** Extra content shown under the row while it is selected (e.g. a warning). */
  detail?: ReactNode;
}

interface SelectionDialogProps {
  title: string;
  desc: string;
  confirmLabel: string;
  rows: SelectionRow[];
  selection: SnapshotSelection;
  onChange: (selection: SnapshotSelection) => void;
  onCancel: () => void;
  onConfirm: () => void;
  emptyLabel: string;
}

/** Checkbox list for choosing what goes into (or comes out of) a backup. */
export function SelectionDialog({
  title,
  desc,
  confirmLabel,
  rows,
  selection,
  onChange,
  onCancel,
  onConfirm,
  emptyLabel,
}: SelectionDialogProps) {
  const t = useT();
  const anySelected = rows.some((row) => row.available && selection[row.key]);

  return (
    <Modal title={title} description={desc} onClose={onCancel}>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="sr-only">{title}</legend>
        {rows.map((row) => (
          <div
            key={row.key}
            className={`rounded-lg border p-3 ${
              row.available ? "border-slate-200 hover:bg-slate-50" : "border-slate-100 opacity-50"
            }`}
          >
            <label className={`flex items-center gap-3 ${row.available ? "cursor-pointer" : ""}`}>
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-primary"
                checked={row.available && selection[row.key]}
                disabled={!row.available}
                onChange={(e) => onChange({ ...selection, [row.key]: e.target.checked })}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-800">{row.label}</span>
                <span className="block truncate text-xs text-slate-500">
                  {row.available ? row.hint : emptyLabel}
                </span>
              </span>
            </label>
            {row.available && selection[row.key] && row.detail && <div className="mt-2 pl-7">{row.detail}</div>}
          </div>
        ))}
      </fieldset>

      {!anySelected && <p className="mt-3 text-sm text-amber-700">{t("backup.nothingSelected")}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="cbr-btn cbr-btn-ghost" onClick={onCancel}>
          {t("common.cancel")}
        </button>
        <button type="button" className="cbr-btn cbr-btn-primary" onClick={onConfirm} disabled={!anySelected}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/** Amber inline warning used inside selection rows. */
export function RowWarning({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-amber-800">
      <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
