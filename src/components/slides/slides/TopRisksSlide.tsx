import type { Level, Report, Risk } from "@/types";
import { AlertTriangle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { SLIDE_LIMITS } from "../slideConstants";
import { riskStatColor, riskTrendColor } from "../palette";
import { RiskMatrix } from "../RiskMatrix";

interface TopRisksSlideProps {
  report: Report;
}

const severityRank: Record<Level, number> = { low: 1, medium: 2, high: 3, critical: 4 };

export function riskScore(risk: Risk): number {
  return severityRank[risk.likelihood] + severityRank[risk.businessImpact];
}

/** Highest-severity risks first, always filled up to the slide's capacity. */
export function risksForSlide(report: Report): Risk[] {
  const max = report.showRiskMatrix ? SLIDE_LIMITS.risksWithMatrix : SLIDE_LIMITS.risksWithoutMatrix;
  return [...report.topRisks].sort((a, b) => riskScore(b) - riskScore(a)).slice(0, max);
}

/** The counts shown in the stats bar. */
export function riskStats(report: Report): { critical: number; worsening: number; improving: number } {
  return {
    critical: report.topRisks.filter((r) => r.likelihood === "critical" || r.businessImpact === "critical").length,
    worsening: report.topRisks.filter((r) => r.trend === "worsening").length,
    improving: report.topRisks.filter((r) => r.trend === "improving").length,
  };
}

export default function TopRisksSlide({ report }: TopRisksSlideProps) {
  const t = useT();
  const shownRisks = risksForSlide(report);

  const counts = riskStats(report);
  const stats = [
    { label: t("slide.risks.critical"), value: counts.critical, color: riskStatColor.critical },
    { label: t("slide.risks.worsening"), value: counts.worsening, color: riskStatColor.worsening },
    { label: t("slide.risks.improving"), value: counts.improving, color: riskStatColor.improving },
  ];

  return (
    <SlideFrame report={report} title={t("section.topRisks")} icon={AlertTriangle}>
      {report.topRisks.length === 0 ? (
        <p className="text-[15px] italic text-slate-400">{t("slide.risks.none")}</p>
      ) : (
        <div className="flex h-full flex-col gap-4">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-slate-50 px-4 py-2.5">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</div>
                <div className="text-[28px] font-bold tabular-nums" style={{ color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div
            className={`grid min-h-0 flex-1 gap-5 ${
              report.showRiskMatrix ? "grid-cols-[1.4fr_1fr]" : "grid-cols-1"
            }`}
          >
            {/* Risk list */}
            <div className={report.showRiskMatrix ? "flex flex-col gap-2" : "grid grid-cols-2 gap-2 content-start"}>
              <h3 className={`m-0 text-[13px] font-bold uppercase tracking-wider text-slate-400 ${report.showRiskMatrix ? "" : "col-span-2"}`}>
                {t("slide.risks.highPriority")}
              </h3>
              {shownRisks.map((risk) => {
                const TrendIcon = risk.trend === "worsening" ? ArrowUp : risk.trend === "stable" ? Minus : ArrowDown;
                const trendColor = riskTrendColor[risk.trend];
                return (
                  <div
                    key={risk.id}
                    className="rounded-lg bg-slate-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="m-0 truncate text-[15px] font-semibold text-slate-900">
                          {risk.name}
                        </h4>
                        {risk.description && (
                          <p className="m-0 mt-0.5 line-clamp-2 text-[13px] text-slate-500">
                            {risk.description}
                          </p>
                        )}
                      </div>
                      <TrendIcon size={16} className="mt-0.5 shrink-0" style={{ color: trendColor }} aria-hidden />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Risk matrix */}
            {report.showRiskMatrix && (
              <div className="flex min-w-0 flex-col">
                <h3 className="m-0 mb-2 text-[13px] font-bold uppercase tracking-wider text-slate-400">
                  {t("slide.risks.distribution")}
                </h3>
                <RiskMatrix risks={report.topRisks} />
              </div>
            )}
          </div>
        </div>
      )}
    </SlideFrame>
  );
}
