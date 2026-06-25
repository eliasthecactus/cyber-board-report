import { Report } from "@/types";
import { AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { usePrimaryColor } from "../slideConstants";

interface IncidentsSlideProps {
  report: Report;
}

const severityColor: Record<string, string> = {
  critical: "#9f1239",
  high: "#92400e",
  medium: "#1e3a5f",
  low: "#065f46",
};

const MAX_INCIDENTS = 3;

export default function IncidentsSlide({ report }: IncidentsSlideProps) {
  const t = useT();
  const accent = usePrimaryColor();
  const incidents = report.incidents.slice(0, MAX_INCIDENTS);

  return (
    <SlideFrame report={report} accent={accent} title={t("ed.inc.title")} icon={AlertCircle}>
      {report.incidents.length === 0 ? (
        <p className="text-[15px] italic text-slate-400">{t("slide.incidents.none")}</p>
      ) : (
        <div className="flex h-full flex-col justify-center gap-3">
          {incidents.map((incident) => {
            const severity = incident.severity || "medium";
            const color = severityColor[severity];
            return (
              <div
                key={incident.id}
                className="rounded-lg bg-slate-50 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="m-0 text-[17px] font-bold text-slate-900">{incident.title}</h3>
                  <span
                    className="shrink-0 rounded px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: color }}
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
        </div>
      )}
    </SlideFrame>
  );
}
