import { useT } from "@/lib/i18n";
import { metricValue } from "@/lib/briefMetrics";
import type { BriefMetric } from "@/types";
import { palette } from "@/components/slides/palette";
import { useAccent } from "@/components/slides/slideConstants";
import { NoData, type BlockProps } from "./shared";

export function TextBlock({ block }: BlockProps<"text">) {
  if (!block.options.text.trim()) {
    return <NoData />;
  }
  return <p className="m-0 whitespace-pre-line text-[13px] leading-snug text-slate-700">{block.options.text}</p>;
}

export function headlineText(report: BlockProps<"headline">["report"], source: "highlight" | "summary"): string {
  return (source === "highlight" ? report.executiveSummaryHighlight : report.executiveSummary) ?? "";
}

export function HeadlineBlock({ block, report }: BlockProps<"headline">) {
  const accent = useAccent();
  const text = headlineText(report, block.options.source);
  const isSummary = block.options.source === "summary";
  return (
    <div className="flex min-h-full items-center gap-3">
      <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: accent.fill }} />
      {text.trim() ? (
        <p className={`m-0 leading-snug text-slate-900 ${isSummary ? "text-[14px]" : "text-[17px] font-semibold"}`}>{text}</p>
      ) : (
        <NoData />
      )}
    </div>
  );
}

export function OutlookBlock({ report }: BlockProps<"outlook">) {
  if (!report.outlook.trim()) {
    return <NoData />;
  }
  return <p className="m-0 whitespace-pre-line text-[13px] leading-snug text-slate-700">{report.outlook}</p>;
}

/** Figures where a value above zero is bad news. */
const WARNING_METRICS: readonly BriefMetric[] = [
  "criticalRisks",
  "worseningRisks",
  "seriousIncidents",
  "initiativesAtRisk",
  "kpisOffTarget",
];

function valueColor(metric: BriefMetric, value: number): string {
  if (metric === "improvingRisks" && value > 0) {
    return palette.good;
  }
  return WARNING_METRICS.includes(metric) && value > 0 ? palette.bad : palette.text;
}

export function StatBlock({ block, report, prior }: BlockProps<"stat">) {
  const t = useT();
  const { metric } = block.options;
  const value = metricValue(metric, report);
  const delta = prior ? value - metricValue(metric, prior) : null;
  return (
    <div className="flex min-h-full items-center gap-3">
      <span className="text-[30px] font-bold leading-none tabular-nums" style={{ color: valueColor(metric, value) }}>
        {value}
      </span>
      <div className="min-w-0">
        <p className="m-0 text-[12px] font-semibold leading-tight text-slate-600">
          {block.title.trim() || t(`brief.metric.${metric}`)}
        </p>
        {prior && delta !== null && (
          <p className="m-0 text-[11px] leading-tight text-slate-400">
            {delta === 0
              ? t("brief.stat.unchanged", { period: `${prior.quarter} ${prior.year}` })
              : t("brief.stat.delta", { delta: delta > 0 ? `+${delta}` : delta, period: `${prior.quarter} ${prior.year}` })}
          </p>
        )}
      </div>
    </div>
  );
}
