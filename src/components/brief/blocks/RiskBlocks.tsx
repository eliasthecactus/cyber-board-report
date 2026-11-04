import { ArrowDown, ArrowUp, Minus, Plus, X, type LucideIcon } from "lucide-react";
import { useT, type MessageKey } from "@/lib/i18n";
import { capitals } from "@/lib/utils";
import { compareRisks, selectRisks, type RiskChange } from "@/lib/briefMetrics";
import { palette, riskTrendColor } from "@/components/slides/palette";
import { RiskMatrix } from "@/components/slides/RiskMatrix";
import { LevelLabel, More, NoData, Note, type BlockProps } from "./shared";

/** Pixel height of one grid row including the gap, and what a matrix needs besides its cells. */
const ROW_PX = 75;
const MATRIX_CHROME_PX = 110;

export function RiskMatrixBlock({ block, report }: BlockProps<"riskMatrix">) {
  if (report.topRisks.length === 0) {
    return <NoData />;
  }
  const cellHeight = Math.max(24, Math.floor((block.h * ROW_PX - MATRIX_CHROME_PX) / 4));
  return <RiskMatrix risks={report.topRisks} cellHeight={cellHeight} />;
}

const headerClass = "pb-1 pr-3 text-left text-[10px] font-bold tracking-wide text-slate-400";

export function RiskTableBlock({ block, report }: BlockProps<"riskTable">) {
  const t = useT();
  const { options } = block;
  const risks = selectRisks(report, options);
  if (risks.length === 0) {
    return <NoData />;
  }
  const hasPicks = options.riskIds.length > 0;
  return (
    <>
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            <th className={headerClass}>{capitals(t("brief.col.risk"))}</th>
            {options.showRatings && <th className={headerClass}>{capitals(t("brief.col.likelihood"))}</th>}
            {options.showRatings && <th className={headerClass}>{capitals(t("brief.col.impact"))}</th>}
            <th className={headerClass}>{capitals(t("brief.col.trend"))}</th>
            {options.showMitigation && <th className={headerClass}>{capitals(t("brief.col.mitigation"))}</th>}
            {options.showOwner && <th className={headerClass}>{capitals(t("brief.col.owner"))}</th>}
          </tr>
        </thead>
        <tbody>
          {risks.map((risk) => {
            const Trend = risk.trend === "worsening" ? ArrowUp : risk.trend === "improving" ? ArrowDown : Minus;
            return (
              <tr key={risk.id} className="border-t border-slate-200 align-top">
                <td className="py-1.5 pr-3">
                  <span className="font-semibold text-slate-900">{risk.name}</span>
                  {options.showDescription && risk.description && (
                    <span className="block text-[11px] leading-snug text-slate-500">{risk.description}</span>
                  )}
                </td>
                {options.showRatings && (
                  <td className="py-1.5 pr-3">
                    <LevelLabel level={risk.likelihood} />
                  </td>
                )}
                {options.showRatings && (
                  <td className="py-1.5 pr-3">
                    <LevelLabel level={risk.businessImpact} />
                  </td>
                )}
                <td className="py-1.5 pr-3">
                  <Trend size={14} style={{ color: riskTrendColor[risk.trend] }} aria-label={t(`enum.${risk.trend}`)} />
                </td>
                {options.showMitigation && <td className="py-1.5 pr-3 leading-snug text-slate-600">{risk.mitigation}</td>}
                {options.showOwner && <td className="py-1.5 pr-1 leading-snug text-slate-600">{risk.owner}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!hasPicks && <More shown={risks.length} total={report.topRisks.length} />}
    </>
  );
}

function MovementGroup({
  label,
  changes,
  Icon,
  color,
}: {
  label: MessageKey;
  changes: RiskChange[];
  Icon: LucideIcon;
  color: string;
}) {
  const t = useT();
  if (changes.length === 0) {
    return null;
  }
  return (
    <div>
      <p className="m-0 mb-0.5 flex items-center gap-1 text-[10px] font-bold tracking-wide" style={{ color }}>
        <Icon size={12} aria-hidden />
        {capitals(t(label))}
      </p>
      {changes.map((change) => (
        <p key={change.name} className="m-0 text-[12px] leading-snug text-slate-700">
          {change.name}
        </p>
      ))}
    </div>
  );
}

export function RiskMovementBlock({ block, report, prior }: BlockProps<"riskMovement">) {
  const t = useT();
  if (!prior) {
    return <Note>{t("brief.movement.noPrior")}</Note>;
  }
  const { options } = block;
  const movement = compareRisks(report.topRisks, prior.topRisks);
  const groups = [
    options.showWorsened && movement.worsened.length > 0,
    options.showNew && movement.added.length > 0,
    options.showImproved && movement.improved.length > 0,
    options.showRemoved && movement.removed.length > 0,
  ];
  if (!groups.some(Boolean)) {
    return <Note>{t("brief.movement.none", { period: `${prior.quarter} ${prior.year}` })}</Note>;
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-[11px] text-slate-400">
        {t("brief.movement.since", { period: `${prior.quarter} ${prior.year}` })}
      </p>
      {options.showWorsened && (
        <MovementGroup label="brief.movement.worsened" changes={movement.worsened} Icon={ArrowUp} color={palette.bad} />
      )}
      {options.showNew && (
        <MovementGroup label="brief.movement.added" changes={movement.added} Icon={Plus} color={palette.blocker} />
      )}
      {options.showImproved && (
        <MovementGroup label="brief.movement.improved" changes={movement.improved} Icon={ArrowDown} color={palette.good} />
      )}
      {options.showRemoved && (
        <MovementGroup label="brief.movement.removed" changes={movement.removed} Icon={X} color={palette.neutral} />
      )}
    </div>
  );
}

export function EmergingRisksBlock({ block, report }: BlockProps<"emergingRisks">) {
  const risks = report.emergingRisks.slice(0, block.options.count);
  if (risks.length === 0) {
    return <NoData />;
  }
  return (
    <div className="flex flex-col gap-1.5">
      {risks.map((risk, index) => (
        <div key={index} className="flex items-start justify-between gap-3">
          <p className="m-0 text-[12px] leading-snug text-slate-700">{risk.description}</p>
          <LevelLabel level={risk.impact} />
        </div>
      ))}
      <More shown={risks.length} total={report.emergingRisks.length} />
    </div>
  );
}
