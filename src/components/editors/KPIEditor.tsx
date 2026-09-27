import { useId, useState } from "react";
import { Trash2, X } from "lucide-react";
import type { KPI, TrendDirection } from "@/types";
import { createId, periodLabel } from "@/lib/reportFactory";
import { useT } from "@/lib/i18n";
import { NumberInput } from "@/components/ui/NumberInput";

interface KPIEditorProps {
  data: KPI[];
  onUpdate: (data: KPI[]) => void;
  /** The open report's quarter ("Q1") and year: its value is the KPI's current value. */
  reportQuarter: string;
  reportYear: number;
}

export default function KPIEditor({ data, onUpdate, reportQuarter, reportYear }: KPIEditorProps) {
  const t = useT();

  const addKPI = () => {
    const newKPI: KPI = {
      id: createId("kpi"),
      name: "",
      unit: "",
      value: 0,
      trend: "stable",
      direction: "higher",
      historicalData: [],
    };
    onUpdate([...data, newKPI]);
  };

  const updateKPI = (id: string, updates: Partial<KPI>) => {
    onUpdate(data.map((kpi) => (kpi.id === id ? { ...kpi, ...updates } : kpi)));
  };

  const deleteKPI = (id: string) => {
    onUpdate(data.filter((kpi) => kpi.id !== id));
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{t("ed.kpi.title")}</h2>
      <p className="text-sm text-slate-500 mb-5">{t("ed.kpi.desc")}</p>

      <div className="flex flex-col gap-6 mb-4">
        {data.map((kpi) => (
          <KpiCard
            key={kpi.id}
            kpi={kpi}
            currentPeriod={periodLabel(reportQuarter, reportYear)}
            onChange={(updates) => updateKPI(kpi.id, updates)}
            onDelete={() => deleteKPI(kpi.id)}
          />
        ))}
      </div>

      <button onClick={addKPI} className="cbr-btn cbr-btn-primary mt-4">
        {t("ed.kpi.add")}
      </button>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mt-5">{t("ed.kpi.tip")}</div>
    </div>
  );
}

interface KpiCardProps {
  kpi: KPI;
  currentPeriod: string;
  onChange: (updates: Partial<KPI>) => void;
  onDelete: () => void;
}

function KpiCard({ kpi, currentPeriod, onChange, onDelete }: KpiCardProps) {
  const t = useT();
  const id = useId();

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div className="mb-3 flex items-center gap-3">
        <input
          type="text"
          aria-label={t("ed.kpi.nameLabel")}
          placeholder={t("ed.kpi.namePlaceholder")}
          value={kpi.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="form-input font-semibold flex-1"
        />
        <button
          onClick={onDelete}
          className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon shrink-0 text-red-500"
          aria-label={t("ed.kpi.delete", { name: kpi.name || t("ed.kpi.untitled") })}
          title={t("common.delete")}
        >
          <Trash2 size={15} aria-hidden />
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">{t("ed.kpi.unitField")}</span>
          <input
            type="text"
            value={kpi.unit}
            onChange={(e) => onChange({ unit: e.target.value })}
            className="form-input form-input-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">{t("ed.kpi.currentValue")}</span>
          <NumberInput
            value={kpi.value}
            onValueChange={(value) => onChange({ value: value ?? 0 })}
            className="form-input form-input-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">{t("ed.kpi.trendLabel")}</span>
          <select
            value={kpi.trend}
            onChange={(e) => onChange({ trend: e.target.value as TrendDirection })}
            className="form-input form-input-sm"
          >
            <option value="up">{t("ed.kpi.up")}</option>
            <option value="stable">{t("ed.kpi.stable")}</option>
            <option value="down">{t("ed.kpi.down")}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">{t("ed.kpi.target")}</span>
          <NumberInput
            value={kpi.targetValue}
            onValueChange={(value) => onChange({ targetValue: value })}
            className="form-input form-input-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">{t("ed.kpi.higherLowerTitle")}</span>
          <select
            value={kpi.direction || "higher"}
            onChange={(e) => onChange({ direction: e.target.value as "higher" | "lower" })}
            className="form-input form-input-sm"
          >
            <option value="higher">{t("ed.kpi.higherBetter")}</option>
            <option value="lower">{t("ed.kpi.lowerBetter")}</option>
          </select>
        </label>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <p id={`${id}-history`} className="text-xs font-semibold text-slate-500 mb-3">
          {t("ed.kpi.historical")}
        </p>

        {kpi.historicalData.length > 0 && (
          <ul className="flex flex-wrap gap-2 mb-4" aria-labelledby={`${id}-history`}>
            {kpi.historicalData.map((hist) => (
              <li
                key={hist.quarter}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
              >
                <span>
                  {hist.quarter}: {hist.value}
                </span>
                <button
                  onClick={() =>
                    onChange({ historicalData: kpi.historicalData.filter((h) => h.quarter !== hist.quarter) })
                  }
                  className="rounded hover:bg-white/20 p-0.5"
                  aria-label={t("ed.kpi.removePoint", { period: hist.quarter })}
                >
                  <X size={12} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        <HistoryForm
          existing={kpi.historicalData.map((h) => h.quarter)}
          currentPeriod={currentPeriod}
          onAdd={(quarter, value) =>
            onChange({ historicalData: [...kpi.historicalData, { quarter, value }] })
          }
        />
      </div>
    </div>
  );
}

interface HistoryFormProps {
  existing: string[];
  currentPeriod: string;
  onAdd: (quarter: string, value: number) => void;
}

function HistoryForm({ existing, currentPeriod, onAdd }: HistoryFormProps) {
  const t = useT();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);
  const [quarter, setQuarter] = useState(1);
  const [year, setYear] = useState(currentYear);
  const [value, setValue] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  // Remounts the value field after adding, which clears it even while focused.
  const [resetKey, setResetKey] = useState(0);

  const period = periodLabel(quarter, year);
  const tooOld = currentYear - year > 2;

  const add = () => {
    if (value === undefined) {
      return;
    }
    if (period === currentPeriod) {
      setError(t("ed.kpi.duplicatePoint"));
      return;
    }
    if (existing.includes(period)) {
      setError(t("ed.kpi.periodExists", { period }));
      return;
    }
    onAdd(period, value);
    setValue(undefined);
    setResetKey((key) => key + 1);
    setError(null);
  };

  return (
    <>
      <div className="flex gap-2 items-end flex-wrap">
        <label className="flex-1 min-w-fit">
          <span className="mb-1 block text-xs font-medium text-slate-500">{t("ed.kpi.quarter")}</span>
          <select
            value={quarter}
            onChange={(e) => {
              setQuarter(Number(e.target.value));
              setError(null);
            }}
            className="form-input form-input-sm"
          >
            {[1, 2, 3, 4].map((q) => (
              <option key={q} value={q}>
                Q{q}
              </option>
            ))}
          </select>
        </label>

        <label className="flex-1 min-w-fit">
          <span className="mb-1 block text-xs font-medium text-slate-500">{t("ed.kpi.year")}</span>
          <select
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setError(null);
            }}
            className="form-input form-input-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <label className="flex-1 min-w-fit">
          <span className="mb-1 block text-xs font-medium text-slate-500">{t("ed.kpi.value2")}</span>
          <NumberInput
            key={resetKey}
            value={value}
            onValueChange={setValue}
            placeholder={t("ed.kpi.valuePlaceholder")}
            className="form-input form-input-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
        </label>

        <button onClick={add} disabled={value === undefined} className="cbr-btn cbr-btn-primary cbr-btn-sm">
          {t("ed.kpi.addDataPoint")}
        </button>
      </div>

      {tooOld && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {t("ed.kpi.oldData")}
        </div>
      )}
      {error && (
        <div role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}
    </>
  );
}
