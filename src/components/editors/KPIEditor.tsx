import { KPI, TrendDirection } from "@/types";
import { createId } from "@/lib/reportFactory";
import { useState } from "react";
import { useT } from "@/lib/i18n";

interface KPIEditorProps {
  data: KPI[];
  onUpdate: (data: KPI[]) => void;
}

export default function KPIEditor({ data, onUpdate }: KPIEditorProps) {
  const t = useT();
  const currentYear = new Date().getFullYear();
  const quarters = [1, 2, 3, 4];
  const years = Array.from({ length: currentYear - 1999 }, (_, i) => 2000 + i);
  
  // Ensure data is an array
  const kpisData = data || [];
  
  // Track which KPIs have old data warnings
  const [warningStates, setWarningStates] = useState<{ [key: string]: boolean }>({});

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
    setWarningStates({
      ...warningStates,
      [kpiId]: yearsOld > 2,
    });
  };

  return (
    <div>
      <h2>{t("ed.kpi.title")}</h2>
      <p className="text-base-content/70 text-sm mb-5">{t("ed.kpi.desc")}</p>

      <div className="flex flex-col gap-6 mb-4">
        {kpisData.map((kpi) => (
          <div key={kpi.id} className="bg-base-200 border border-base-300 rounded p-5">
            {/* Main KPI Info Row */}
            <div className="flex gap-3 items-end mb-4">
              <input
                type="text"
                placeholder={t("ed.kpi.namePlaceholder")}
                value={kpi.name}
                onChange={(e) => updateKPI(kpi.id, { name: e.target.value })}
                className="input input-bordered font-semibold text-base flex-1"
              />
              <input
                type="text"
                placeholder={t("ed.kpi.unitField")}
                value={kpi.unit}
                onChange={(e) => updateKPI(kpi.id, { unit: e.target.value })}
                className="input input-bordered input-sm w-28"
              />
              <input
                type="number"
                placeholder={t("ed.kpi.currentValue")}
                value={kpi.value}
                onChange={(e) => updateKPI(kpi.id, { value: parseFloat(e.target.value) })}
                className="input input-bordered input-sm w-24"
              />
              <select
                value={kpi.trend}
                onChange={(e) =>
                  updateKPI(kpi.id, { trend: e.target.value as TrendDirection })
                }
                className="select select-bordered select-sm w-24"
              >
                <option value="up">📈 {t("ed.kpi.up")}</option>
                <option value="stable">➡️ {t("ed.kpi.stable")}</option>
                <option value="down">📉 {t("ed.kpi.down")}</option>
              </select>
              <input
                type="number"
                placeholder={t("ed.kpi.target")}
                value={kpi.targetValue || ""}
                onChange={(e) =>
                  updateKPI(kpi.id, { targetValue: parseFloat(e.target.value) || undefined })
                }
                className="input input-bordered input-sm w-20"
              />
              <select
                value={kpi.direction || "higher"}
                onChange={(e) =>
                  updateKPI(kpi.id, { direction: e.target.value as "higher" | "lower" })
                }
                className="select select-bordered select-sm w-28"
                title={t("ed.kpi.higherLowerTitle")}
              >
                <option value="higher">⬆️ {t("ed.kpi.higherBetter")}</option>
                <option value="lower">⬇️ {t("ed.kpi.lowerBetter")}</option>
              </select>
              <button
                onClick={() => deleteKPI(kpi.id)}
                className="btn btn-error btn-sm"
              >
                {t("common.delete")}
              </button>
            </div>

            {/* Historical Data Section */}
            <div className="border-t border-base-300 pt-4">
              <p className="text-xs font-semibold text-base-content/60 mb-3">
                📊 {t("ed.kpi.historical")}
              </p>

              {/* Historical Data Badges */}
              {kpi.historicalData && kpi.historicalData.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {kpi.historicalData.map((hist, idx) => (
                    <div key={idx} className="badge badge-primary gap-2 py-3 px-3">
                      <span className="text-xs font-semibold">
                        {hist.quarter}: {hist.value}
                      </span>
                      <button
                        onClick={() => {
                          const updated = kpi.historicalData.filter(
                            (_, i) => i !== idx
                          );
                          updateKPI(kpi.id, { historicalData: updated });
                        }}
                        className="btn btn-xs btn-ghost hover:bg-primary-focus h-5 w-5 p-0"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Historical Data Inputs */}
              <div className="flex gap-2 items-end flex-wrap">
                <div className="form-control flex-1 min-w-fit">
                  <label className="label label-text label-text-sm">{t("ed.kpi.quarter")}</label>
                  <select
                    id={`quarter-sel-${kpi.id}`}
                    defaultValue="1"
                    className="select select-bordered select-sm"
                  >
                    {quarters.map((q) => (
                      <option key={q} value={q}>
                        Q{q}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control flex-1 min-w-fit">
                  <label className="label label-text label-text-sm">{t("ed.kpi.year")}</label>
                  <select
                    id={`year-sel-${kpi.id}`}
                    defaultValue={currentYear}
                    onChange={(e) => handleYearChange(kpi.id, parseInt(e.target.value))}
                    className="select select-bordered select-sm"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control flex-1 min-w-fit">
                  <label className="label label-text label-text-sm">{t("ed.kpi.value2")}</label>
                  <input
                    type="number"
                    placeholder={t("ed.kpi.valuePlaceholder")}
                    id={`value-${kpi.id}`}
                    className="input input-bordered input-sm"
                  />
                </div>

                <button
                  onClick={() => {
                    const quarterSel = document.getElementById(
                      `quarter-sel-${kpi.id}`
                    ) as HTMLSelectElement;
                    const yearSel = document.getElementById(
                      `year-sel-${kpi.id}`
                    ) as HTMLSelectElement;
                    const valueInput = document.getElementById(
                      `value-${kpi.id}`
                    ) as HTMLInputElement;

                    if (quarterSel.value && yearSel.value && valueInput.value) {
                      const quarter = parseInt(quarterSel.value);
                      const year = parseInt(yearSel.value);
                      const value = parseFloat(valueInput.value);

                      const newHist = [
                        ...(kpi.historicalData || []),
                        {
                          quarter: formatQuarter(quarter, year),
                          value: value,
                        },
                      ];
                      updateKPI(kpi.id, { historicalData: newHist });

                      // Reset inputs
                      quarterSel.value = "1";
                      yearSel.value = String(currentYear);
                      valueInput.value = "";
                    }
                  }}
                  className="btn btn-primary btn-sm"
                >
                  {t("ed.kpi.addDataPoint")}
                </button>
              </div>

              {/* Warning for old data */}
              {warningStates[kpi.id] && (
                <div className="alert alert-warning mt-3 py-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4v2m0-6a4 4 0 100 8 4 4 0 000-8z"
                    ></path>
                  </svg>
                  <span className="text-sm">{t("ed.kpi.oldData")}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button onClick={addKPI} className="btn btn-success mt-4">
        {t("ed.kpi.add")}
      </button>

      <div className="alert alert-info mt-5">
        <div>
          <span>{t("ed.kpi.tip")}</span>
        </div>
      </div>
    </div>
  );
}
