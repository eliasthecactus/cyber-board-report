import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { DomainTrend, InitiativeStatus, KPI, Report } from "@/types";
import { useT } from "@/lib/i18n";
import { withAlpha } from "@/lib/color";
import { isOffTarget, selectIncidents, selectInitiatives, selectKpis } from "@/lib/briefMetrics";
import { kpiSeries } from "@/components/slides/slides/KPISlide";
import { Sparkline, StackedBar } from "../charts";
import { statusTone, useBriefTheme } from "../theme";
import { LevelPill, More, NoData, Pill, type BlockProps } from "./shared";

function KpiCard({ kpi, report, showChart, showTarget }: { kpi: KPI; report: Report; showChart: boolean; showTarget: boolean }) {
  const t = useT();
  const theme = useBriefTheme();
  const hasTarget = kpi.targetValue !== undefined;
  const offTarget = isOffTarget(kpi);
  const tone = !hasTarget ? theme.accent : offTarget ? theme.level.high : theme.good;
  return (
    <div className="flex min-h-0 min-w-0 flex-col rounded-[10px] bg-brief-raised px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <p className="m-0 min-w-0 truncate text-[11px] font-medium text-brief-muted">{kpi.name}</p>
        {hasTarget && <Pill color={tone}>{t(offTarget ? "brief.kpi.offTarget" : "brief.kpi.onTarget")}</Pill>}
      </div>
      <div className="flex min-h-0 flex-1 items-end gap-3">
        <div className="shrink-0">
          <p className="m-0 whitespace-nowrap text-[28px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-brief-ink">
            {kpi.value}
            <span className="ml-0.5 text-[13px] font-medium tracking-normal text-brief-muted">{kpi.unit}</span>
          </p>
          {showTarget && hasTarget && (
            <p className="m-0 mt-1 text-[10.5px] leading-none text-brief-muted">
              {t("slide.kpi.target", { value: kpi.targetValue ?? "" })}
            </p>
          )}
        </div>
        {showChart && (
          <Sparkline
            values={kpiSeries(kpi, report).map((point) => point.value)}
            target={kpi.targetValue}
            color={tone}
            className="mb-0.5 mr-1 mt-1.5 min-w-0 flex-1 self-stretch"
          />
        )}
      </div>
    </div>
  );
}

export function KpisBlock({ block, report }: BlockProps<"kpis">) {
  const kpis = selectKpis(report, block.options);
  if (kpis.length === 0) {
    return <NoData />;
  }
  const columns = kpis.length <= 2 ? kpis.length : Math.min(3, Math.ceil(kpis.length / 2));
  return (
    <div
      className="grid h-full gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridAutoRows: "minmax(0, 1fr)" }}
    >
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.id}
          kpi={kpi}
          report={report}
          showChart={block.options.showChart}
          showTarget={block.options.showTarget}
        />
      ))}
    </div>
  );
}

export function IncidentsBlock({ block, report }: BlockProps<"incidents">) {
  const t = useT();
  const theme = useBriefTheme();
  const all = selectIncidents(report, block.options);
  const incidents = all.slice(0, block.options.count);
  if (incidents.length === 0) {
    return <NoData />;
  }
  return (
    <div className="flex h-full flex-col gap-2.5">
      {incidents.map((incident) => (
        <div key={incident.id} className="flex max-h-[84px] flex-1 gap-3">
          <span
            className="w-[3px] shrink-0 rounded-full"
            style={{ backgroundColor: incident.severity ? theme.level[incident.severity] : theme.line }}
          />
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="flex items-start justify-between gap-3">
              <p className="m-0 text-[13.5px] font-semibold leading-snug text-brief-ink">{incident.title}</p>
              {incident.severity && <LevelPill level={incident.severity} />}
            </div>
            {incident.businessImpact && <p className="m-0 text-[12px] leading-snug">{incident.businessImpact}</p>}
            {block.options.showOutcome && incident.outcome && (
              <p className="m-0 text-[11px] leading-snug text-brief-muted">
                {t("slide.incidents.outcome")} {incident.outcome}
              </p>
            )}
          </div>
        </div>
      ))}
      <More shown={incidents.length} total={all.length} />
    </div>
  );
}

const STATUSES: InitiativeStatus[] = ["on-track", "at-risk", "delayed", "not-started"];

export function InitiativesBlock({ block, report }: BlockProps<"initiatives">) {
  const t = useT();
  const theme = useBriefTheme();
  const all = selectInitiatives(report, block.options);
  const initiatives = all.slice(0, block.options.count);
  if (initiatives.length === 0) {
    return <NoData />;
  }
  const portfolio = STATUSES.map((status) => ({
    key: status,
    value: report.initiatives.filter((initiative) => initiative.status === status).length,
    color: statusTone(theme, status),
  }));
  return (
    <div className="flex h-full flex-col gap-2">
      <div>
        <StackedBar parts={portfolio} />
        <div className="mt-1.5 flex flex-wrap gap-x-3">
          {portfolio
            .filter((part) => part.value > 0)
            .map((part) => (
              <span key={part.key} className="flex items-center gap-1 whitespace-nowrap text-[10.5px] text-brief-muted">
                <span className="font-semibold tabular-nums" style={{ color: part.color }}>
                  {part.value}
                </span>
                {t(`slide.status.${part.key}`)}
              </span>
            ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-evenly gap-1">
        {initiatives.map((initiative) => {
          const tone = statusTone(theme, initiative.status);
          return (
            <div key={initiative.id}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="m-0 min-w-0 truncate text-[12px] font-medium leading-snug text-brief-ink">{initiative.name}</p>
                <span className="shrink-0 whitespace-nowrap text-[11px] tabular-nums text-brief-muted">
                  <span className="mr-1.5 font-medium" style={{ color: tone }}>
                    {t(`slide.status.${initiative.status}`)}
                  </span>
                  {initiative.progress}%
                </span>
              </div>
              <div className="mt-[3px] h-[5px] overflow-hidden rounded-full" style={{ backgroundColor: theme.line }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${initiative.progress}%`, backgroundColor: tone }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <More shown={initiatives.length} total={all.length} />
    </div>
  );
}

const TREND_ICON: Record<DomainTrend, typeof Minus> = {
  more: ArrowUpRight,
  stable: Minus,
  less: ArrowDownRight,
};

export function ItemsBlock({ block, report }: BlockProps<"items">) {
  const theme = useBriefTheme();
  const { source, count, showDetail } = block.options;
  const all = report[source].filter((item) => item.text.trim());
  const items = all.slice(0, count);
  if (items.length === 0) {
    return <NoData />;
  }
  // More threats are bad news. More items in a programme section are just more items.
  const trendColor = (trend: DomainTrend) =>
    source !== "threatLandscape"
      ? theme.accent
      : { more: theme.bad, stable: theme.neutral, less: theme.good }[trend];
  return (
    <div className="flex h-full flex-col justify-evenly gap-1">
      {items.map((item) => {
        const Trend = TREND_ICON[item.trend];
        const color = trendColor(item.trend);
        return (
          <div key={item.id} className="flex items-start gap-2.5">
            <span
              className="mt-px flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full"
              style={{ color, backgroundColor: withAlpha(color, 0.14) }}
            >
              <Trend size={13} strokeWidth={2.5} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="m-0 text-[12.5px] font-medium leading-snug text-brief-ink">{item.text}</p>
              {showDetail && item.detail && <p className="m-0 text-[11px] leading-snug text-brief-muted">{item.detail}</p>}
            </div>
          </div>
        );
      })}
      <More shown={items.length} total={all.length} />
    </div>
  );
}

export function DecisionsBlock({ block, report }: BlockProps<"decisions">) {
  const decisions = report.decisionsRequired.slice(0, block.options.count);
  if (decisions.length === 0) {
    return <NoData />;
  }
  // Few decisions are the main message of the slide and get room to be.
  const roomy = decisions.length * 3 <= block.h * 2;
  return (
    <div className="flex h-full flex-col gap-2">
      {decisions.map((decision, index) => (
        <div key={decision.id} className="flex min-h-0 flex-1 items-center gap-4 rounded-[10px] bg-brief-raised px-4 py-2">
          <span
            className={`shrink-0 font-semibold leading-none tracking-[-0.03em] tabular-nums text-brief-muted ${
              roomy ? "w-9 text-[40px]" : "w-6 text-[26px]"
            }`}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <p
              className={`m-0 font-semibold leading-snug tracking-[-0.01em] text-brief-ink ${
                roomy ? "text-[18px]" : "text-[14px]"
              }`}
            >
              {decision.title}
            </p>
            {block.options.showRationale && decision.rationale && (
              <p className={`m-0 mt-0.5 leading-snug ${roomy ? "text-[13px]" : "text-[11.5px]"}`}>{decision.rationale}</p>
            )}
          </div>
        </div>
      ))}
      <More shown={decisions.length} total={report.decisionsRequired.length} />
    </div>
  );
}
