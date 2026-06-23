import { Report } from "@/types";
import { AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { ACCENTS } from "../slideConstants";

interface IncidentsSlideProps {
  report: Report;
}

const severityColor: Record<string, string> = {
  critical: "#dc2626",
  high: "#d97706",
  medium: "#2563eb",
  low: "#16a34a",
};

const MAX_INCIDENTS = 3;

export default function IncidentsSlide({ report }: IncidentsSlideProps) {
  const t = useT();
  const accent = ACCENTS.incidents;
  const incidents = report.incidents.slice(0, MAX_INCIDENTS);

  return (
    <SlideFrame report={report} accent={accent} title={t("ed.inc.title")} icon={AlertCircle}>
      {report.incidents.length === 0 ? (
        <p className="text-[20px] text-slate-400">{t("slide.incidents.none")}</p>
      ) : (
        <div className="flex h-full flex-col justify-center gap-3.5">
          {incidents.map((incident) => {
            const severity = incident.severity || "medium";
            const color = severityColor[severity];
            return (
              <div
                key={incident.id}
                className="rounded-xl border-l-4 bg-slate-50 p-4"
                style={{ borderColor: color }}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="m-0 text-[19px] font-bold text-slate-900">{incident.title}</h3>
                  <span
                    className="shrink-0 rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-white"
                    style={{ backgroundColor: color }}
                  >
                    {t(`enum.${severity}`)}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-[16px] leading-snug text-slate-600">
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
