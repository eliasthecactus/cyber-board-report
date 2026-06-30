import { Report } from "@/types";
import { AlertTriangle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { usePrimaryColor } from "../slideConstants";

interface TopRisksSlideProps {
  report: Report;
}

const riskLevels: Record<string, Record<string, string>> = {
  low: { low: "green", medium: "yellow", high: "orange", critical: "red" },
  medium: { low: "yellow", medium: "orange", high: "red", critical: "red" },
  high: { low: "orange", medium: "red", high: "red", critical: "red" },
  critical: { low: "red", medium: "red", high: "red", critical: "red" },
};

const cellColor: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-800",
  yellow: "bg-amber-50 text-amber-800",
  orange: "bg-orange-50 text-orange-800",
  red: "bg-red-50 text-red-800",
  gray: "bg-slate-50 text-slate-800",
};

const MAX_RISKS = 4;

export default function TopRisksSlide({ report }: TopRisksSlideProps) {
  const t = useT();
  const accent = usePrimaryColor();

  const getRiskColor = (likelihood: string, impact: string) =>
    riskLevels[likelihood]?.[impact] || "gray";

  const criticalRisks = report.topRisks.filter(
    (r) =>
      r.likelihood === "critical" ||
      r.businessImpact === "critical" ||
      (r.likelihood === "high" && r.businessImpact === "high"),
  );
  const shownRisks = (criticalRisks.length ? criticalRisks : report.topRisks).slice(0, MAX_RISKS);

  const criticalCount = report.topRisks.filter(
    (r) => r.likelihood === "critical" || r.businessImpact === "critical",
  ).length;
  const worseningCount = report.topRisks.filter((r) => r.trend === "worsening").length;
  const improvingCount = report.topRisks.filter((r) => r.trend === "improving").length;

  const matrixHeaders = [
    t("slide.risks.mLow"),
    t("slide.risks.mMed"),
    t("slide.risks.mHigh"),
    t("slide.risks.mCrit"),
  ];
  const levels = ["low", "medium", "high", "critical"];

  const stats = [
    { label: t("slide.risks.critical"), value: criticalCount, color: "#9f1239" },
    { label: t("slide.risks.worsening"), value: worseningCount, color: "#9a3412" },
    { label: t("slide.risks.improving"), value: improvingCount, color: "#065f46" },
  ];

  return (
    <SlideFrame report={report} accent={accent} title={t("section.topRisks")} icon={AlertTriangle}>
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
                const trendColor = risk.trend === "worsening" ? "#dc2626" : risk.trend === "improving" ? "#059669" : "#94a3b8";
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
                      <TrendIcon size={16} className="mt-0.5 shrink-0" style={{ color: trendColor }} />
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
              <div className="flex gap-1.5">
                <div className="relative flex w-4 items-center justify-center">
                  <span
                    className="absolute whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-slate-400"
                    style={{ transform: "rotate(-90deg)", transformOrigin: "center center" }}
                  >
                    {t("ed.risks.likelihood")}
                  </span>
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="grid grid-cols-5 gap-1 text-center">
                    <div />
                    {matrixHeaders.map((imp) => (
                      <div key={imp} className="text-[11px] font-bold uppercase text-slate-400">
                        {imp}
                      </div>
                    ))}
                    {levels.map((likelihood) => (
                      <div key={likelihood} className="contents">
                        <div className="flex items-center justify-end pr-1 text-[11px] font-bold uppercase text-slate-400">
                          {likelihood[0].toUpperCase()}
                        </div>
                        {levels.map((impact) => {
                          const count = report.topRisks.filter(
                            (r) => r.likelihood === likelihood && r.businessImpact === impact,
                          ).length;
                          return (
                            <div
                              key={`${likelihood}-${impact}`}
                              className={`flex h-[48px] items-center justify-center rounded text-[14px] font-semibold ${cellColor[getRiskColor(likelihood, impact)]}`}
                            >
                              {count || ""}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="mt-1.5 grid grid-cols-5">
                    <div />
                    <div className="col-span-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {t("ed.risks.impact")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      )}
    </SlideFrame>
  );
}
