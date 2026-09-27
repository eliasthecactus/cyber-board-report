import type { Report } from "@/types";
import { AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { SLIDE_LIMITS } from "../slideConstants";
import { levelColor } from "../palette";

interface IncidentsSlideProps {
  report: Report;
}

export default function IncidentsSlide({ report }: IncidentsSlideProps) {
  const t = useT();
  const incidents = report.incidents.slice(0, SLIDE_LIMITS.incidents);
  const remaining = report.incidents.length - incidents.length;

  return (
    <SlideFrame report={report} title={t("ed.inc.title")} icon={AlertCircle}>
      {report.incidents.length === 0 ? (
        <p className="text-[15px] italic text-slate-400">{t("slide.incidents.none")}</p>
      ) : (
        <div className="flex h-full flex-col justify-center gap-3">
          {incidents.map((incident) => {
            const severity = incident.severity || "medium";
            return (
              <div key={incident.id} className="rounded-lg bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="m-0 text-[17px] font-bold text-slate-900">{incident.title}</h3>
                  <span
                    className="shrink-0 rounded px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: levelColor[severity] }}
                  >
                    {t(`enum.${severity}`)}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-[14px] leading-snug text-slate-600">
                  <p className="m-0">
                    <span className="font-semibold text-slate-700">
                      {t("slide.incidents.businessImpact")}
                    </span>{" "}
                    {incident.businessImpact}
                  </p>
                  <p className="m-0">
                    <span className="font-semibold text-slate-700">
                      {t("slide.incidents.outcome")}
                    </span>{" "}
                    {incident.outcome}
                  </p>
                  {incident.lessonsLearned && (
                    <p className="m-0">
                      <span className="font-semibold text-slate-700">
                        {t("slide.incidents.lesson")}
                      </span>{" "}
                      {incident.lessonsLearned}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {remaining > 0 && (
            <p className="m-0 text-[14px] italic text-slate-400">
              {t("slide.more", { count: remaining })}
            </p>
          )}
        </div>
      )}
    </SlideFrame>
  );
}
