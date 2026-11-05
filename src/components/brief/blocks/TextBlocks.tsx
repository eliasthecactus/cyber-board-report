import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { withAlpha } from "@/lib/color";
import { metricPolarity, metricTotal, metricValue } from "@/lib/briefMetrics";
import type { BriefMetric } from "@/types";
import { PartOfWhole, Sparkline } from "../charts";
import { useBriefTheme, type ResolvedTheme } from "../theme";
import { fittingTextSize, NoData, type BlockProps } from "./shared";

function FittedText({ text, block }: { text: string; block: { w: number; h: number } }) {
  return (
    <p className="m-0 whitespace-pre-line leading-[1.5] tracking-[-0.005em]" style={{ fontSize: fittingTextSize(text, block) }}>
      {text}
    </p>
  );
}

export function TextBlock({ block }: BlockProps<"text">) {
  if (!block.options.text.trim()) {
    return <NoData />;
  }
  return <FittedText text={block.options.text} block={block} />;
}

export function headlineText(report: BlockProps<"headline">["report"], source: "highlight" | "summary"): string {
  return (source === "highlight" ? report.executiveSummaryHighlight : report.executiveSummary) ?? "";
}

export function HeadlineBlock({ block, report }: BlockProps<"headline">) {
  const text = headlineText(report, block.options.source);
  const isSummary = block.options.source === "summary";
  return (
    <div className="flex h-full items-center">
      {text.trim() ? (
        <p
          className={`m-0 text-brief-ink ${
            isSummary ? "text-[14.5px] leading-snug" : "text-[18.5px] font-medium leading-[1.25] tracking-[-0.012em]"
          }`}
        >
          {text}
        </p>
      ) : (
        <NoData />
      )}
    </div>
  );
}

export function OutlookBlock({ block, report }: BlockProps<"outlook">) {
  if (!report.outlook.trim()) {
    return <NoData />;
  }
  return <FittedText text={report.outlook} block={block} />;
}

/** The colour of a figure: red for bad news, green for good news, neutral otherwise. */
function valueTone(metric: BriefMetric, value: number, theme: ResolvedTheme): string | null {
  if (value === 0) {
    return null;
  }
  const polarity = metricPolarity(metric);
  return polarity === "lowerIsBetter" ? theme.bad : polarity === "higherIsBetter" ? theme.good : null;
}

/** The colour of a change: whether it went the right way depends on the figure. */
function deltaTone(metric: BriefMetric, delta: number, theme: ResolvedTheme): string {
  const polarity = metricPolarity(metric);
  if (delta === 0 || polarity === "neutral") {
    return theme.neutral;
  }
  return delta > 0 === (polarity === "higherIsBetter") ? theme.good : theme.bad;
}

function Delta({ delta, color, label }: { delta: number; color: string; label: string }) {
  const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  return (
    <span className="flex items-center gap-1 whitespace-nowrap text-[11px] font-medium" style={{ color }}>
      <Icon size={13} strokeWidth={2.5} aria-hidden />
      {label}
    </span>
  );
}

export function StatBlock({ block, report, prior, earlier }: BlockProps<"stat">) {
  const t = useT();
  const theme = useBriefTheme();
  const { metric } = block.options;
  const value = metricValue(metric, report);
  const total = metricTotal(metric, report);
  const tone = valueTone(metric, value, theme);
  const color = tone ?? theme.accent;
  const label = block.title.trim() || t(`brief.metric.${metric}`);
  const series = [...earlier, report].map((item) => metricValue(metric, item));

  const delta = prior ? value - metricValue(metric, prior) : null;
  const deltaLabel =
    prior && delta !== null
      ? delta === 0
        ? t("brief.stat.unchanged", { period: `${prior.quarter} ${prior.year}` })
        : t("brief.stat.delta", { delta: delta > 0 ? `+${delta}` : delta, period: `${prior.quarter} ${prior.year}` })
      : null;
  const deltaMark = delta !== null && deltaLabel && (
    <Delta delta={delta} color={deltaTone(metric, delta, theme)} label={deltaLabel} />
  );
  const figure = (size: string) => (
    <span
      className={`font-semibold leading-none tracking-[-0.035em] tabular-nums ${size}`}
      style={{ color: tone ?? theme.ink }}
    >
      {value}
    </span>
  );
  const tint = tone && (
    <span
      aria-hidden
      className="absolute inset-0"
      style={{ backgroundImage: `linear-gradient(120deg, ${withAlpha(tone, 0.13)}, ${withAlpha(tone, 0)} 62%)` }}
    />
  );

  // One row high: everything in a line.
  if (block.h === 1) {
    return (
      <>
        {tint}
        <div className="relative flex h-full items-center gap-3">
          {figure("text-[34px]")}
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-[12px] font-medium leading-tight text-brief-ink">{label}</p>
            {deltaMark}
          </div>
          {block.w >= 3 && label.length <= 22 && (
            <Sparkline values={series} color={color} className="mr-1 h-8 w-14 shrink-0" />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {tint}
      <div className="relative flex h-full flex-col justify-between gap-1">
        <p className="m-0 truncate text-[12px] font-medium leading-tight text-brief-body">{label}</p>
        <div className="flex min-h-0 flex-1 items-end gap-4">
          <p className="m-0 flex shrink-0 items-baseline gap-1.5 whitespace-nowrap">
            {figure("text-[50px]")}
            {total !== null && (
              <span className="text-[13px] font-medium text-brief-muted">{t("brief.stat.of", { total })}</span>
            )}
          </p>
          <Sparkline values={series} color={color} className="mb-1 mr-1 h-[42px] min-w-0 flex-1" />
        </div>
        <div className="flex h-4 items-center justify-between gap-3">
          {deltaMark || <span />}
          {total !== null && <PartOfWhole part={value} total={total} color={color} />}
        </div>
      </div>
    </>
  );
}
