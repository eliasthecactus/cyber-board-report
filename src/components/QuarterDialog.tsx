import { useState, type FormEvent } from "react";
import { useT } from "@/lib/i18n";
import { QUARTERS } from "@/lib/reportFactory";
import { Modal } from "@/components/ui/Modal";

interface QuarterDialogProps {
  title: string;
  description?: string;
  submitLabel: string;
  initialQuarter?: string;
  initialYear?: number;
  /** Return an error message to keep the dialog open, or null on success. */
  onSubmit: (quarter: string, year: number) => Promise<string | null> | string | null;
  onCancel: () => void;
}

/** Pick a quarter and year; used for create, duplicate and "change quarter". */
export function QuarterDialog({
  title,
  description,
  submitLabel,
  initialQuarter = "",
  initialYear = new Date().getFullYear(),
  onSubmit,
  onCancel,
}: QuarterDialogProps) {
  const t = useT();
  const [quarter, setQuarter] = useState(initialQuarter);
  const [year, setYear] = useState(String(initialYear));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const yearNumber = Number(year);
  const yearValid = Number.isInteger(yearNumber) && yearNumber >= 2000 && yearNumber <= 2100;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!quarter || !yearValid) return;
    setBusy(true);
    try {
      const result = await onSubmit(quarter, yearNumber);
      setError(result);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={title} description={description} onClose={onCancel} busy={busy}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="quarter-select" className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("dashboard.quarter")}
          </label>
          <select
            id="quarter-select"
            value={quarter}
            onChange={(event) => {
              setQuarter(event.target.value);
              setError(null);
            }}
            required
            className="form-input"
            data-autofocus
          >
            <option value="">{t("dashboard.selectQuarter")}</option>
            {QUARTERS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="year-input" className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("dashboard.year")}
          </label>
          <input
            id="year-input"
            type="number"
            value={year}
            onChange={(event) => {
              setYear(event.target.value);
              setError(null);
            }}
            required
            min="2000"
            max="2100"
            className="form-input"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="cbr-btn cbr-btn-ghost" onClick={onCancel} disabled={busy}>
            {t("common.cancel")}
          </button>
          <button type="submit" className="cbr-btn cbr-btn-primary" disabled={!quarter || !yearValid || busy}>
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
