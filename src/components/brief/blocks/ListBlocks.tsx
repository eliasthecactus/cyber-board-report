import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { DomainTrend } from "@/types";
import { useT } from "@/lib/i18n";
import { selectIncidents, selectInitiatives, selectKpis } from "@/lib/briefMetrics";
import { palette, statusColor } from "@/components/slides/palette";
import { useAccent } from "@/components/slides/slideConstants";
import { KpiTile } from "@/components/slides/slides/KPISlide";
import { LevelLabel, More, NoData, type BlockProps } from "./shared";

export function KpisBlock({ block, report }: BlockProps<"kpis">) {
  const kpis = selectKpis(report, block.options);
  if (kpis.length === 0) {
    return <NoData />;
  }
  const columns = kpis.length <= 2 ? kpis.length : Math.min(3, Math.ceil(kpis.length / 2));
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {kpis.map((kpi) => (
        <KpiTile
          // The chart measures its width once, so it has to remount when the block is resized.
          key={`${kpi.id}-${block.w}-${columns}`}
          kpi={kpi}
          report={report}
          showChart={block.options.showChart}
          showTarget={block.options.showTarget}
          compact
        />
      ))}
    </div>
  );
}

export function IncidentsBlock({ block, report }: BlockProps<"incidents">) {
  const t = useT();
  const all = selectIncidents(report, block.options);
  const incidents = all.slice(0, block.options.count);
  if (incidents.length === 0) {
    return <NoData />;
  }
  return (
    <div className="flex flex-col gap-2">
      {incidents.map((incident) => (
        <div key={incident.id}>
          <div className="flex items-start justify-between gap-3">
            <p className="m-0 text-[12px] font-semibold leading-snug text-slate-900">{incident.title}</p>
            {incident.severity && <LevelLabel level={incident.severity} />}
          </div>
          {incident.businessImpact && (
            <p className="m-0 text-[12px] leading-snug text-slate-600">{incident.businessImpact}</p>
          )}
          {block.options.showOutcome && incident.outcome && (
            <p className="m-0 text-[11px] leading-snug text-slate-500">
              {t("slide.incidents.outcome")} {incident.outcome}
            </p>
          )}
        </div>
      ))}
      <More shown={incidents.length} total={all.length} />
    </div>
  );
}

export function InitiativesBlock({ block, report }: BlockProps<"initiatives">) {
  const t = useT();
  const accent = useAccent();
  const all = selectInitiatives(report, block.options);
  const initiatives = all.slice(0, block.options.count);
  if (initiatives.length === 0) {
    return <NoData />;
  }
  return (
    <div className="flex flex-col gap-2">
      {initiatives.map((initiative) => (
        <div key={initiative.id}>
          <div className="flex items-baseline justify-between gap-3">
            <p className="m-0 text-[12px] font-semibold leading-snug text-slate-900">{initiative.name}</p>
            <span
              className="whitespace-nowrap text-[11px] font-semibold"
              style={{ color: statusColor[initiative.status] }}
            >
              {t(`slide.status.${initiative.status}`)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full"
                style={{ width: `${initiative.progress}%`, backgroundColor: accent.fill }}
              />
            </div>
            <span className="w-8 text-right text-[11px] tabular-nums text-slate-500">{initiative.progress}%</span>
          </div>
        </div>
      ))}
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
  const { source, count, showDetail } = block.options;
  const all = report[source].filter((item) => item.text.trim());
  const items = all.slice(0, count);
  if (items.length === 0) {
    return <NoData />;
  }
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item) => {
        const Trend = TREND_ICON[item.trend];
        return (
          <div key={item.id} className="flex items-start gap-1.5">
            <Trend size={14} className="mt-px shrink-0" style={{ color: palette.muted }} aria-hidden />
            <div className="min-w-0">
              <p className="m-0 text-[12px] font-medium leading-snug text-slate-800">{item.text}</p>
              {showDetail && item.detail && (
                <p className="m-0 text-[11px] leading-snug text-slate-500">{item.detail}</p>
              )}
            </div>
          </div>
        );
      })}
      <More shown={items.length} total={all.length} />
    </div>
  );
}

export function DecisionsBlock({ block, report }: BlockProps<"decisions">) {
  const accent = useAccent();
  const decisions = report.decisionsRequired.slice(0, block.options.count);
  if (decisions.length === 0) {
    return <NoData />;
  }
  return (
    <div className="flex flex-col gap-2">
      {decisions.map((decision, index) => (
        <div key={decision.id} className="flex items-start gap-2">
          <span
            className="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ backgroundColor: accent.fill, color: accent.onFill }}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="m-0 text-[12px] font-semibold leading-snug text-slate-900">{decision.title}</p>
            {block.options.showRationale && decision.rationale && (
              <p className="m-0 text-[11px] leading-snug text-slate-600">{decision.rationale}</p>
            )}
          </div>
        </div>
      ))}
      <More shown={decisions.length} total={report.decisionsRequired.length} />
    </div>
  );
}
