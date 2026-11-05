import { ArrowDown, ArrowUp, Minus, Plus, X, type LucideIcon } from "lucide-react";
import type { Level, Report, Trend } from "@/types";
import { useT, type MessageKey } from "@/lib/i18n";
import { readableOn, withAlpha } from "@/lib/color";
import { capitals } from "@/lib/utils";
import { compareRisks, rankedRisks, riskBands, scoreBand, selectRisks, type RiskChange } from "@/lib/briefMetrics";
import { LEVELS } from "@/components/slides/RiskMatrix";
import { riskScore } from "@/components/slides/slides/TopRisksSlide";
import { useBriefTheme } from "../theme";
import { LevelMeter, More, NoData, Note, type BlockProps } from "./shared";

/** Bubbles that fit a heat map cell before the rest is summed up as "+n". */
const CELL_BUBBLES = 6;
/** Pixel height of one grid row including the gap. */
const ROW_PX = 75;
/** What the movement block needs besides its list, and the height of one list row. */
const MOVEMENT_CHROME_PX = 128;
const MOVEMENT_ROW_PX = 23;
/** What the trend chart needs besides its bars. */
const TREND_CHROME_PX = 120;

function RiskNumber({ number, color }: { number: number; color: string }) {
  return (
    <span
      className="flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums"
      style={{ backgroundColor: color, color: readableOn(color) }}
    >
      {number}
    </span>
  );
}

const axisClass = "text-[9.5px] font-semibold tracking-[0.1em] text-brief-muted";

/** Likelihood × impact with each risk as a numbered bubble, matching the numbers of the risk table. */
export function RiskMatrixBlock({ report }: BlockProps<"riskMatrix">) {
  const t = useT();
  const theme = useBriefTheme();
  if (report.topRisks.length === 0) {
    return <NoData />;
  }
  const ranked = rankedRisks(report);
  const labels = [t("slide.risks.mLow"), t("slide.risks.mMed"), t("slide.risks.mHigh"), t("slide.risks.mCrit")];
  return (
    <div className="flex h-full gap-1.5">
      <div className="relative w-3 shrink-0">
        <span
          className={`absolute left-1/2 top-[46%] whitespace-nowrap ${axisClass}`}
          style={{ transform: "translate(-50%, -50%) rotate(-90deg)" }}
        >
          {capitals(t("ed.risks.likelihood"))}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div
          className="grid min-h-0 flex-1 gap-[5px]"
          style={{
            gridTemplateColumns: "42px repeat(4, minmax(0, 1fr))",
            gridTemplateRows: "repeat(4, minmax(0, 1fr)) 14px",
          }}
        >
          {[...LEVELS].reverse().map((likelihood) => (
            <div key={likelihood} className="contents">
              <span className={`flex items-center justify-end pr-1 ${axisClass}`}>
                {capitals(labels[LEVELS.indexOf(likelihood)])}
              </span>
              {LEVELS.map((impact) => {
                const heat = LEVELS.indexOf(likelihood) + LEVELS.indexOf(impact);
                const tone = theme.level[scoreBand(heat + 2)];
                const here = ranked.filter((r) => r.likelihood === likelihood && r.businessImpact === impact);
                const shown = here.slice(0, here.length > CELL_BUBBLES ? CELL_BUBBLES - 1 : CELL_BUBBLES);
                return (
                  <div
                    key={impact}
                    className="flex min-h-0 flex-wrap content-center items-center justify-center gap-[3px] overflow-hidden rounded-md"
                    style={{ backgroundColor: withAlpha(tone, 0.13 + heat * 0.03) }}
                  >
                    {shown.map((risk) => (
                      <RiskNumber key={risk.id} number={ranked.indexOf(risk) + 1} color={tone} />
                    ))}
                    {here.length > shown.length && (
                      <span className="text-[10px] font-semibold text-brief-ink">+{here.length - shown.length}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          <span />
          {labels.map((label) => (
            <span key={label} className={`text-center ${axisClass}`}>
              {capitals(label)}
            </span>
          ))}
        </div>
        <p className={`m-0 pl-[47px] text-center ${axisClass}`}>{capitals(t("ed.risks.impact"))}</p>
      </div>
    </div>
  );
}

const TREND_ICON: Record<Trend, LucideIcon> = { worsening: ArrowUp, improving: ArrowDown, stable: Minus };

function TrendMark({ trend }: { trend: Trend }) {
  const t = useT();
  const theme = useBriefTheme();
  const color = { worsening: theme.bad, improving: theme.good, stable: theme.neutral }[trend];
  const Icon = TREND_ICON[trend];
  return (
    <span
      className="flex h-[21px] w-[21px] items-center justify-center rounded-full"
      style={{ color, backgroundColor: withAlpha(color, 0.14) }}
    >
      <Icon size={13} strokeWidth={2.5} aria-label={t(`enum.${trend}`)} />
    </span>
  );
}

const headerClass = "pb-1.5 pr-3 text-left text-[9.5px] font-semibold tracking-[0.1em] text-brief-muted";
const cellClass = "py-[7px] pr-3 align-middle";

export function RiskTableBlock({ block, report }: BlockProps<"riskTable">) {
  const t = useT();
  const theme = useBriefTheme();
  const { options } = block;
  const risks = selectRisks(report, options);
  if (risks.length === 0) {
    return <NoData />;
  }
  const ranked = rankedRisks(report);
  return (
    <>
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            <th className={headerClass}>
              <span className="sr-only">{t("brief.col.number")}</span>
            </th>
            <th className={headerClass}>{capitals(t("brief.col.risk"))}</th>
            {options.showRatings && <th className={headerClass}>{capitals(t("brief.col.likelihood"))}</th>}
            {options.showRatings && <th className={headerClass}>{capitals(t("brief.col.impact"))}</th>}
            <th className={headerClass}>{capitals(t("brief.col.trend"))}</th>
            {options.showMitigation && <th className={headerClass}>{capitals(t("brief.col.mitigation"))}</th>}
            {options.showOwner && <th className={headerClass}>{capitals(t("brief.col.owner"))}</th>}
          </tr>
        </thead>
        <tbody>
          {risks.map((risk) => (
            <tr key={risk.id} className="border-t border-brief-line">
              <td className={cellClass}>
                <RiskNumber number={ranked.indexOf(risk) + 1} color={theme.level[scoreBand(riskScore(risk))]} />
              </td>
              <td className={cellClass}>
                <span className="font-semibold leading-tight text-brief-ink">{risk.name}</span>
                {options.showDescription && risk.description && (
                  <span className="block text-[11px] leading-snug text-brief-muted">{risk.description}</span>
                )}
              </td>
              {options.showRatings && (
                <td className={cellClass}>
                  <LevelMeter level={risk.likelihood} />
                </td>
              )}
              {options.showRatings && (
                <td className={cellClass}>
                  <LevelMeter level={risk.businessImpact} />
                </td>
              )}
              <td className={cellClass}>
                <TrendMark trend={risk.trend} />
              </td>
              {options.showMitigation && <td className={`${cellClass} leading-snug`}>{risk.mitigation}</td>}
              {options.showOwner && <td className={`${cellClass} leading-snug text-brief-muted`}>{risk.owner}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {options.riskIds.length === 0 && <More shown={risks.length} total={report.topRisks.length} />}
    </>
  );
}

interface MovementKind {
  key: "worsened" | "added" | "improved" | "removed";
  label: MessageKey;
  Icon: LucideIcon;
  color: string;
  changes: RiskChange[];
}

function MovementRow({ change, kind }: { change: RiskChange; kind: MovementKind }) {
  const { Icon, color } = kind;
  return (
    <div className="flex items-center gap-2 border-t border-brief-line py-[3px]">
      <Icon size={13} strokeWidth={2.5} className="shrink-0" style={{ color }} aria-hidden />
      <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-4 text-brief-ink">{change.name}</span>
      <span className="shrink-0 text-[11px] tabular-nums text-brief-muted">
        {change.before ?? ""} → {change.now ?? ""}
      </span>
    </div>
  );
}

export function RiskMovementBlock({ block, report, prior }: BlockProps<"riskMovement">) {
  const t = useT();
  const theme = useBriefTheme();
  if (!prior) {
    return <Note>{t("brief.movement.noPrior")}</Note>;
  }
  const { options } = block;
  const movement = compareRisks(report.topRisks, prior.topRisks);
  const period = `${prior.quarter} ${prior.year}`;
  const kinds: MovementKind[] = (
    [
      options.showWorsened && {
        key: "worsened",
        label: "brief.movement.worsened",
        Icon: ArrowUp,
        color: theme.bad,
        changes: movement.worsened,
      },
      options.showNew && {
        key: "added",
        label: "brief.movement.added",
        Icon: Plus,
        color: theme.level.high,
        changes: movement.added,
      },
      options.showImproved && {
        key: "improved",
        label: "brief.movement.improved",
        Icon: ArrowDown,
        color: theme.good,
        changes: movement.improved,
      },
      options.showRemoved && {
        key: "removed",
        label: "brief.movement.removed",
        Icon: X,
        color: theme.neutral,
        changes: movement.removed,
      },
    ] as (MovementKind | false)[]
  ).filter((kind) => kind !== false);

  if (kinds.every((kind) => kind.changes.length === 0)) {
    return <Note>{t("brief.movement.none", { period })}</Note>;
  }
  const rows = kinds.flatMap((kind) => kind.changes.map((change) => ({ kind, change })));
  const maxRows = Math.floor((block.h * ROW_PX - MOVEMENT_CHROME_PX) / MOVEMENT_ROW_PX);
  const shown = rows.slice(0, rows.length > maxRows ? maxRows - 1 : maxRows);
  return (
    <div className="flex flex-col gap-1.5">
      <p className="absolute right-4 top-3 m-0 text-[10.5px] text-brief-muted">{t("brief.movement.since", { period })}</p>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${kinds.length}, minmax(0, 1fr))` }}>
        {kinds.map((kind) => (
          <div key={kind.key} className="min-w-0 rounded-lg bg-brief-raised px-2.5 py-1.5">
            <p className="m-0 text-[20px] font-semibold leading-none tabular-nums" style={{ color: kind.color }}>
              {kind.changes.length}
            </p>
            <p className="m-0 mt-1 truncate text-[10px] font-medium leading-tight text-brief-muted">{t(kind.label)}</p>
          </div>
        ))}
      </div>
      <div className="[&>div:first-child]:border-t-0">
        {shown.map(({ kind, change }) => (
          <MovementRow key={`${kind.key}-${change.name}`} change={change} kind={kind} />
        ))}
      </div>
      <More shown={shown.length} total={rows.length} />
    </div>
  );
}

/** Worst first, which stacks the bars with the worst band on top. */
const BANDS: { level: Level; scores: string }[] = [
  { level: "critical", scores: "7-8" },
  { level: "high", scores: "6" },
  { level: "medium", scores: "4-5" },
  { level: "low", scores: "2-3" },
];

function TrendColumn({ report, scale, height, current }: { report: Report; scale: number; height: number; current: boolean }) {
  const theme = useBriefTheme();
  const bands = riskBands(report);
  const total = report.topRisks.length;
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-end gap-1">
        <span className={`text-[12px] font-semibold tabular-nums ${current ? "text-brief-ink" : "text-brief-muted"}`}>
          {total}
        </span>
        <div
          className="flex w-full max-w-[46px] flex-col gap-[2px]"
          style={{ height: `${(total / scale) * 84}%`, opacity: current ? 1 : 0.55 }}
        >
          {BANDS.filter(({ level }) => bands[level] > 0).map(({ level }) => (
            <span
              key={level}
              className="flex min-h-[3px] items-center justify-center overflow-hidden rounded-[4px] text-[10.5px] font-semibold tabular-nums"
              style={{ flexGrow: bands[level], backgroundColor: theme.level[level], color: readableOn(theme.level[level]) }}
            >
              {(bands[level] / scale) * height >= 15 && bands[level]}
            </span>
          ))}
        </div>
      </div>
      <span className={`whitespace-nowrap text-[10px] tabular-nums ${current ? "font-semibold text-brief-ink" : "text-brief-muted"}`}>
        {report.quarter} {String(report.year).slice(-2)}
      </span>
    </div>
  );
}

/** How the risks spread over the score bands, quarter by quarter. */
export function RiskTrendBlock({ block, report, earlier }: BlockProps<"riskTrend">) {
  const t = useT();
  const theme = useBriefTheme();
  const reports = [...earlier, report];
  const scale = Math.max(...reports.map((item) => item.topRisks.length));
  if (scale === 0) {
    return <NoData />;
  }
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex min-h-0 flex-1 gap-1.5">
        {reports.map((item) => (
          <TrendColumn
            key={item.id}
            report={item}
            scale={scale}
            height={block.h * ROW_PX - TREND_CHROME_PX}
            current={item === report}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 text-[10px] text-brief-muted">
        <span>{t("brief.trend.score")}</span>
        {BANDS.map(({ level, scores }) => (
          <span key={level} className="flex items-center gap-1 whitespace-nowrap tabular-nums">
            <span className="h-[7px] w-[7px] rounded-[2px]" style={{ backgroundColor: theme.level[level] }} />
            {scores}
          </span>
        ))}
      </div>
    </div>
  );
}

export function EmergingRisksBlock({ block, report }: BlockProps<"emergingRisks">) {
  const risks = report.emergingRisks.slice(0, block.options.count);
  if (risks.length === 0) {
    return <NoData />;
  }
  return (
    <div className="flex h-full flex-col">
      {risks.map((risk, index) => (
        <div
          key={index}
          className="flex max-h-16 flex-1 items-center justify-between gap-3 border-t border-brief-line py-1 first:border-t-0"
        >
          <p className="m-0 text-[13px] leading-snug text-brief-ink">{risk.description}</p>
          <LevelMeter level={risk.impact} />
        </div>
      ))}
      <More shown={risks.length} total={report.emergingRisks.length} />
    </div>
  );
}

