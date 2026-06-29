import { KPI, TrendDirection } from "@/types";
import { createId } from "@/lib/reportFactory";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { X } from "lucide-react";

interface KPIEditorProps {
  data: KPI[];
  onUpdate: (data: KPI[]) => void;
  // current open report quarter (e.g. "Q1") and year to prevent adding duplicate historical points
  reportQuarter?: string;
  reportYear?: number;
}

export default function KPIEditor({ data, onUpdate, reportQuarter, reportYear }: KPIEditorProps) {
  const t = useT();
  const currentYear = new Date().getFullYear();
  const quarters = [1, 2, 3, 4];
  const years = Array.from({ length: currentYear - 1999 }, (_, i) => 2000 + i);

  const kpisData = data || [];

  const [warningStates, setWarningStates] = useState<{ [key: string]: boolean }>({});
  const [duplicateStates, setDuplicateStates] = useState<{ [key: string]: boolean }>({});

  const addKPI = () => {
    const newKPI: KPI = {
      id: createId("kpi"),
      name: "",
      unit: "",
      value: 0,
      trend: "stable",
      historicalData: [],
    };
    onUpdate([...kpisData, newKPI]);
  };

  const updateKPI = (id: string, updates: Partial<KPI>) => {
    onUpdate(kpisData.map((kpi) => (kpi.id === id ? { ...kpi, ...updates } : kpi)));
  };

  const deleteKPI = (id: string) => {
    onUpdate(kpisData.filter((kpi) => kpi.id !== id));
  };

  const formatQuarter = (quarter: number, year: number) => {
    return `Q${quarter}-${year}`;
  };

  const handleYearChange = (kpiId: string, year: number) => {
    const yearsOld = currentYear - year;
    setWarningStates({ ...warningStates, [kpiId]: yearsOld > 2 });
  };
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{t("ed.kpi.title")}</h2>
      <p className="text-sm text-slate-500 mb-5">{t("ed.kpi.desc")}</p>

      <div className="flex flex-col gap-6 mb-4">
        {kpisData.map((kpi) => (
          <div key={kpi.id} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3">
              <input
                type="text"
                placeholder={t("ed.kpi.namePlaceholder")}
                value={kpi.name}
                onChange={(e) => updateKPI(kpi.id, { name: e.target.value })}
                className="form-input font-semibold w-full"
              />
            </div>

            <div className="flex gap-3 items-end mb-4 flex-wrap">
              <input
                type="text"
                placeholder={t("ed.kpi.unitField")}
                value={kpi.unit}
                onChange={(e) => updateKPI(kpi.id, { unit: e.target.value })}
                className="form-input form-input-sm w-28"
              />
              <input
                type="number"
                placeholder={t("ed.kpi.currentValue")}
                value={kpi.value}
                onChange={(e) => updateKPI(kpi.id, { value: parseFloat(e.target.value) })}
                className="form-input form-input-sm w-24"
              />
              <select
                value={kpi.trend}
                onChange={(e) => updateKPI(kpi.id, { trend: e.target.value as TrendDirection })}
                className="form-input form-input-sm w-24"
              >
                <option value="up">{t("ed.kpi.up")}</option>
                <option value="stable">{t("ed.kpi.stable")}</option>
                <option value="down">{t("ed.kpi.down")}</option>
              </select>
              <input
                type="number"
                placeholder={t("ed.kpi.target")}
                value={kpi.targetValue || ""}
                onChange={(e) => updateKPI(kpi.id, { targetValue: parseFloat(e.target.value) || undefined })}
                className="form-input form-input-sm w-20"
              />
              <select
                value={kpi.direction || "higher"}
                onChange={(e) => updateKPI(kpi.id, { direction: e.target.value as "higher" | "lower" })}
                className="form-input form-input-sm w-28"
                title={t("ed.kpi.higherLowerTitle")}
              >
                <option value="higher">{t("ed.kpi.higherBetter")}</option>
                <option value="lower">{t("ed.kpi.lowerBetter")}</option>
              </select>
              <button onClick={() => deleteKPI(kpi.id)} className="cbr-btn cbr-btn-danger cbr-btn-sm">
                {t("common.delete")}
              </button>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold text-slate-500 mb-3">{t("ed.kpi.historical")}</p>

              {kpi.historicalData && kpi.historicalData.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {kpi.historicalData.map((hist, idx) => (
                    <div key={idx} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white">
                      <span>{hist.quarter}: {hist.value}</span>
                      <button onClick={() => updateKPI(kpi.id, { historicalData: kpi.historicalData!.filter((_, i) => i !== idx) })} className="rounded hover:bg-white/20 p-0.5">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 items-end flex-wrap">
                <div className="flex-1 min-w-fit">
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t("ed.kpi.quarter")}</label>
                  <select id={`quarter-sel-${kpi.id}`} defaultValue="1" className="form-input form-input-sm">
                    {quarters.map((q) => <option key={q} value={q}>Q{q}</option>)}
                  </select>
                </div>

                <div className="flex-1 min-w-fit">
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t("ed.kpi.year")}</label>
                  <select id={`year-sel-${kpi.id}`} defaultValue={currentYear} onChange={(e) => handleYearChange(kpi.id, parseInt(e.target.value))} className="form-input form-input-sm">
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="flex-1 min-w-fit">
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t("ed.kpi.value2")}</label>
                  <input type="number" placeholder={t("ed.kpi.valuePlaceholder")} id={`value-${kpi.id}`} className="form-input form-input-sm" />
                </div>

                <button onClick={() => {
                  const quarterSel = document.getElementById(`quarter-sel-${kpi.id}`) as HTMLSelectElement;
                  const yearSel = document.getElementById(`year-sel-${kpi.id}`) as HTMLSelectElement;
                  const valueInput = document.getElementById(`value-${kpi.id}`) as HTMLInputElement;
                  if (quarterSel.value && yearSel.value && valueInput.value) {
                    const quarter = parseInt(quarterSel.value);
                    const year = parseInt(yearSel.value);
                    const value = parseFloat(valueInput.value);
                    const newQuarterLabel = formatQuarter(quarter, year);
                    const currentLabel = reportQuarter && reportYear ? `${reportQuarter}-${reportYear}` : null;
                    if (currentLabel && newQuarterLabel === currentLabel) {
                      setDuplicateStates({ ...duplicateStates, [kpi.id]: true });
                      setTimeout(() => setDuplicateStates((s) => ({ ...s, [kpi.id]: false })), 2500);
                      return;
                    }
                    const newHist = [...(kpi.historicalData || []), { quarter: newQuarterLabel, value }];
                    updateKPI(kpi.id, { historicalData: newHist });
                    quarterSel.value = "1";
                    yearSel.value = String(currentYear);
                    valueInput.value = "";
                  }
                }} className="cbr-btn cbr-btn-primary cbr-btn-sm">{t("ed.kpi.addDataPoint")}</button>
              </div>

              {warningStates[kpi.id] && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{t("ed.kpi.oldData")}</div>}
              {duplicateStates[kpi.id] && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{t("ed.kpi.duplicatePoint") || "Cannot add data for the open report quarter."}</div>}
            </div>
          </div>
        ))}
      </div>

      <button onClick={addKPI} className="cbr-btn cbr-btn-primary mt-4">{t("ed.kpi.add")}</button>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mt-5">{t("ed.kpi.tip")}</div>
    </div>
  );
}

