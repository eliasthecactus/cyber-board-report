import { Report, KPI } from "@/types";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { usePrimaryColor } from "../slideConstants";

interface KPISlideProps {
  report: Report;
}

const MAX_KPIS = 6;

function isTrendGood(kpi: KPI): boolean {
  const direction = kpi.direction || "higher";
  return (
    (direction === "higher" && kpi.trend === "up") ||
    (direction === "lower" && kpi.trend === "down")
  );
}

function sortHistorical(data: KPI["historicalData"]) {
  if (!data?.length) return [];
  return [...data].sort((a, b) => {
    const am = a.quarter.match(/Q(\d)-?(\d{4})/);
    const bm = b.quarter.match(/Q(\d)-?(\d{4})/);
    if (!am || !bm) return 0;
    return parseInt(am[2]) - parseInt(bm[2]) || parseInt(am[1]) - parseInt(bm[1]);
  });
}

export default function KPISlide({ report }: KPISlideProps) {
  const t = useT();
  const accent = usePrimaryColor();
  const kpis = report.kpis.slice(0, MAX_KPIS);

  const trendBadge = (kpi: KPI) => {
    const good = isTrendGood(kpi);
    const color =
      kpi.trend === "stable" ? "#64748b" : good ? "#059669" : "#dc2626";
    const bg =
      kpi.trend === "stable" ? "#f1f5f9" : good ? "#ecfdf5" : "#fef2f2";
    const Icon = kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;
    return (
      <span
        className="flex h-7 w-7 items-center justify-center rounded-md"
        style={{ backgroundColor: bg, color }}
      >
        <Icon size={16} />
      </span>
    );
  };

  return (
    <SlideFrame report={report} accent={accent} title={t("ed.kpi.title")} icon={BarChart3}>
      {report.kpis.length === 0 ? (
        <p className="text-[15px] italic text-slate-400">{t("slide.kpi.none")}</p>
      ) : (
        <div className="grid h-full grid-cols-3 grid-rows-2 gap-3">
          {kpis.map((kpi) => {
            const history = sortHistorical(kpi.historicalData);
            return (
              <div
                key={kpi.id}
                className="flex flex-col rounded-lg bg-slate-50 p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="m-0 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                    {kpi.name}
                  </p>
                  {trendBadge(kpi)}
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-[30px] font-bold text-slate-900">
                    {kpi.value}
                  </span>
                  <span className="text-[14px] text-slate-400">{kpi.unit}</span>
                  {kpi.targetValue !== undefined && (
                    <span className="ml-auto self-center text-[12px] text-slate-400">
                      {t("slide.kpi.target", { value: kpi.targetValue })}
                    </span>
                  )}
                </div>
                {history.length >= 2 && (
                  <div className="mt-auto h-[60px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="quarter" tick={{ fontSize: 9, fill: "#94a3b8" }} interval="preserveStartEnd" />
                        {kpi.targetValue !== undefined && (
                          <ReferenceLine y={kpi.targetValue} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1} />
                        )}
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={accent}
                          strokeWidth={2}
                          dot={{ fill: accent, r: 2.5 }}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SlideFrame>
  );
}
