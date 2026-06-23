import { Report } from "@/types";
import { AlertTriangle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { ACCENTS } from "../slideConstants";

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
  green: "bg-emerald-100 text-emerald-900",
  yellow: "bg-amber-100 text-amber-900",
  orange: "bg-orange-100 text-orange-900",
  red: "bg-red-100 text-red-900",
  gray: "bg-slate-100 text-slate-900",
};

const MAX_RISKS = 4;

export default function TopRisksSlide({ report }: TopRisksSlideProps) {
  const t = useT();
  const accent = ACCENTS.topRisks;

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
    { label: t("slide.risks.critical"), value: criticalCount, color: "#dc2626" },
    { label: t("slide.risks.worsening"), value: worseningCount, color: "#ea580c" },
    { label: t("slide.risks.improving"), value: improvingCount, color: "#16a34a" },
  ];

  return (
    <SlideFrame report={report} accent={accent} title={t("section.topRisks")} icon={AlertTriangle}>
      {report.topRisks.length === 0 ? (
        <p className="text-[20px] text-slate-400">{t("slide.risks.none")}</p>
      ) : (
        <div className="flex h-full flex-col gap-5">
          <div className="grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-3"
              >
                <div className="text-[14px] font-semibold text-slate-500">{s.label}</div>
                <div className="text-[32px] font-bold" style={{ color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[1.4fr_1fr] gap-6">
            <div className="flex flex-col gap-2.5">
              <h3 className="m-0 text-[15px] font-bold uppercase tracking-wide text-slate-500">
                {t("slide.risks.highPriority")}
              </h3>
              {shownRisks.map((risk) => (
                <div
                  key={risk.id}
                  className="rounded-lg border-l-4 bg-slate-50 p-3"
                  style={{
                    borderColor:
                      getRiskColor(risk.likelihood, risk.businessImpact) === "red"
                        ? "#dc2626"
                        : getRiskColor(risk.likelihood, risk.businessImpact) === "orange"
                          ? "#ea580c"
                          : "#d97706",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="m-0 truncate text-[17px] font-semibold text-slate-900">
                        {risk.name}
                      </h4>
                      {risk.description && (
                        <p className="m-0 mt-0.5 line-clamp-2 text-[14px] text-slate-500">
                          {risk.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[18px]">
                      {risk.trend === "worsening" ? "↑" : risk.trend === "stable" ? "→" : "↓"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex min-w-0 flex-col">
              <h3 className="m-0 mb-2 text-[15px] font-bold uppercase tracking-wide text-slate-500">
                {t("slide.risks.distribution")}
              </h3>
              <div className="flex gap-1.5">
                {/* Y axis: likelihood increases downward */}
                <div className="flex items-center">
                  <span className="whitespace-nowrap text-[12px] font-bold uppercase tracking-wide text-slate-500 [writing-mode:vertical-rl] rotate-180">
                    {t("ed.risks.likelihood")}
                  </span>
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="grid grid-cols-5 gap-1 text-center">
                    <div />
                    {matrixHeaders.map((imp) => (
                      <div key={imp} className="text-[13px] font-bold text-slate-500">
                        {imp}
                      </div>
                    ))}
                    {levels.map((likelihood) => (
                      <div key={likelihood} className="contents">
                        <div className="flex items-center justify-end pr-1 text-[13px] font-bold text-slate-500">
                          {likelihood[0].toUpperCase()}
                        </div>
                        {levels.map((impact) => {
                          const count = report.topRisks.filter(
                            (r) => r.likelihood === likelihood && r.businessImpact === impact,
                          ).length;
                          return (
                            <div
                              key={`${likelihood}-${impact}`}
                              className={`flex h-[52px] items-center justify-center rounded text-[16px] font-semibold ${cellColor[getRiskColor(likelihood, impact)]}`}
                            >
                              {count || ""}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  {/* X axis: business impact increases rightward */}
                  <div className="mt-1.5 grid grid-cols-5">
                    <div />
                    <div className="col-span-4 text-center text-[12px] font-bold uppercase tracking-wide text-slate-500">
                      {t("ed.risks.impact")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SlideFrame>
  );
}
