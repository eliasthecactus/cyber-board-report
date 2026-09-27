import type { KPI, Report } from "@/types";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, CartesianGrid, ReferenceLine } from "recharts";
import { useT } from "@/lib/i18n";
import { periodLabel } from "@/lib/reportFactory";
import { SlideFrame } from "../SlideFrame";
import { FixedChart } from "../FixedChart";
import { SLIDE_LIMITS, useAccent } from "../slideConstants";
import { palette } from "../palette";

interface KPISlideProps {
  report: Report;
}

export function isTrendGood(kpi: KPI): boolean {
  const direction = kpi.direction || "higher";
  return (
    (direction === "higher" && kpi.trend === "up") ||
    (direction === "lower" && kpi.trend === "down")
  );
}

export function trendColors(kpi: KPI): { fg: string; bg: string } {
  if (kpi.trend === "stable") {
    return { fg: palette.neutral, bg: palette.neutralBg };
  }
  return isTrendGood(kpi) ? { fg: palette.good, bg: palette.goodBg } : { fg: palette.bad, bg: palette.badBg };
}

function periodRank(label: string): number {
  const match = label.match(/Q(\d)-?(\d{4})/);
  return match ? Number(match[2]) * 10 + Number(match[1]) : 0;
}

/** History sorted by period, plus the current value when it isn't recorded yet. */
export function kpiSeries(kpi: KPI, report: Report): { quarter: string; value: number }[] {
  const history = [...kpi.historicalData].sort((a, b) => periodRank(a.quarter) - periodRank(b.quarter));
  const currentLabel = periodLabel(report.quarter, report.year);
  return history.some((h) => h.quarter === currentLabel)
    ? history
    : [...history, { quarter: currentLabel, value: kpi.value }];
}

export default function KPISlide({ report }: KPISlideProps) {
  const t = useT();
  const accent = useAccent();
  const kpis = report.kpis.slice(0, SLIDE_LIMITS.kpis);

  return (
    <SlideFrame report={report} title={t("ed.kpi.title")} icon={BarChart3}>
      {report.kpis.length === 0 ? (
        <p className="text-[15px] italic text-slate-400">{t("slide.kpi.none")}</p>
      ) : (
        <div className="grid h-full grid-cols-3 grid-rows-2 gap-3">
          {kpis.map((kpi) => {
            const plotData = kpiSeries(kpi, report);
            const colors = trendColors(kpi);
            const Icon = kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;
            return (
              <div key={kpi.id} className="flex min-w-0 flex-col rounded-lg bg-slate-50 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="m-0 text-[12px] font-semibold uppercase tracking-wider text-slate-500">
                    {kpi.name}
                  </p>
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: colors.bg, color: colors.fg }}
                  >
                    <Icon size={16} aria-hidden />
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-[30px] font-bold text-slate-900">{kpi.value}</span>
                  <span className="text-[14px] text-slate-500">{kpi.unit}</span>
                  {kpi.targetValue !== undefined && (
                    <span className="ml-auto self-center text-[12px] text-slate-500">
                      {t("slide.kpi.target", { value: kpi.targetValue })}
                    </span>
                  )}
                </div>
                {plotData.length >= 2 && (
                  <div className="mt-auto">
                    <FixedChart height={60}>
                      {(width) => (
                        <LineChart
                          width={width}
                          height={60}
                          data={plotData}
                          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={palette.border} vertical={false} />
                          <XAxis
                            dataKey="quarter"
                            tick={{ fontSize: 9, fill: palette.faint }}
                            interval="preserveStartEnd"
                          />
                          {kpi.targetValue !== undefined && (
                            <ReferenceLine
                              y={kpi.targetValue}
                              stroke={palette.faint}
                              strokeDasharray="4 4"
                              strokeWidth={1}
                            />
                          )}
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={accent.text}
                            strokeWidth={2}
                            dot={{ fill: accent.text, r: 2.5 }}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      )}
                    </FixedChart>
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
