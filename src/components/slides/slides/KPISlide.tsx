import { Report, KPI } from "@/types";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { ACCENTS } from "../slideConstants";

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
  const accent = ACCENTS.kpis;
  const kpis = report.kpis.slice(0, MAX_KPIS);

  const trendBadge = (kpi: KPI) => {
    const good = isTrendGood(kpi);
    const color =
      kpi.trend === "stable" ? "#64748b" : good ? "#16a34a" : "#dc2626";
    const bg =
      kpi.trend === "stable" ? "#f1f5f9" : good ? "#dcfce7" : "#fee2e2";
    const Icon = kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;
    return (
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: bg, color }}
      >
        <Icon size={20} />
      </span>
    );
  };

  return (
    <SlideFrame report={report} accent={accent} title={t("ed.kpi.title")} icon={BarChart3}>
      {report.kpis.length === 0 ? (
        <p className="text-[20px] text-slate-400">{t("slide.kpi.none")}</p>
      ) : (
        <div className="grid h-full grid-cols-3 grid-rows-2 gap-4">
          {kpis.map((kpi) => {
            const history = sortHistorical(kpi.historicalData);
            return (
              <div
                key={kpi.id}
                className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="m-0 text-[13px] font-semibold uppercase tracking-wide text-slate-500">
                    {kpi.name}
                  </p>
                  {trendBadge(kpi)}
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-[34px] font-bold" style={{ color: accent }}>
                    {kpi.value}
                  </span>
                  <span className="text-[15px] text-slate-400">{kpi.unit}</span>
                  {kpi.targetValue !== undefined && (
                    <span className="ml-auto self-center text-[13px] text-slate-400">
                      {t("slide.kpi.target", { value: kpi.targetValue })}
                    </span>
                  )}
                </div>
                {history.length >= 2 && (
                  <div className="mt-auto h-[64px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="quarter" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={accent}
                          strokeWidth={2.5}
                          dot={{ fill: accent, r: 3 }}
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
