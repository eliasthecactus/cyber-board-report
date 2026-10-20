import type { KPI, Report } from "@/types";
import { BookOpen } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { SLIDE_LIMITS } from "../slideConstants";

interface KPIExplanationsSlideProps {
  report: Report;
}

/** The KPIs shown on the KPI slide that have an explanation, in the same order. */
export function kpisToExplain(report: Report): KPI[] {
  return report.kpis.slice(0, SLIDE_LIMITS.kpis).filter((kpi) => kpi.explanation?.trim());
}

/** Shown before the KPI slide when "Explain KPIs" is on. */
export default function KPIExplanationsSlide({ report }: KPIExplanationsSlideProps) {
  const t = useT();
  const kpis = kpisToExplain(report);

  return (
    <SlideFrame report={report} title={t("slide.kpiExplanations.title")} icon={BookOpen}>
      {kpis.length === 0 ? (
        <p className="text-[15px] italic text-slate-400">{t("slide.kpiExplanations.none")}</p>
      ) : (
        <div className="flex h-full flex-col justify-center">
          <div className="grid grid-cols-2 gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.id} className="min-w-0 rounded-lg bg-slate-50 p-4">
                <p className="m-0 text-[12px] font-semibold uppercase tracking-wider text-slate-500">
                  {kpi.name}
                </p>
                <p className="m-0 mt-1.5 line-clamp-5 whitespace-pre-line text-[15px] leading-snug text-slate-700">
                  {kpi.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </SlideFrame>
  );
}
