import { Report } from "@/types";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import styles from "../SlideRenderer.module.css";

interface IncidentsSlideProps {
  report: Report;
  compact?: boolean;
}

export default function IncidentsSlide({ report, compact: _compact = true }: IncidentsSlideProps) {
  const severityConfig: Record<string, {badge: string; icon: JSX.Element; bg: string}> = {
    critical: {
      badge: "badge-error",
      icon: <AlertCircle size={16} />,
      bg: "bg-error/10 border-error/30"
    },
    high: {
      badge: "badge-warning",
      icon: <AlertCircle size={16} />,
      bg: "bg-warning/10 border-warning/30"
    },
    medium: {
      badge: "badge-info",
      icon: <AlertCircle size={16} />,
      bg: "bg-info/10 border-info/30"
    },
    low: {
      badge: "badge-success",
      icon: <CheckCircle2 size={16} />,
      bg: "bg-success/10 border-success/30"
    },
  };

  return (
    <>
      <h2>Incidents & Lessons Learned</h2>
      <div className={styles.content}>
        {report.incidents.length === 0 ? (
          <p>No incidents recorded</p>
        ) : (
          <div className="flex flex-col gap-4">
            {report.incidents.slice(0, 3).map((incident) => {
              const severity = incident.severity || "medium";
              const config = severityConfig[severity];
              return (
                <div key={incident.id} className={`card bg-base-100 border-l-4 border-opacity-50 rounded-lg p-4 ${config.bg}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2 flex-1">
                      <div className= "text-opacity-70 shrink-0 mt-0.5">
                        {config.icon}
                      </div>
                      <h3 className="m-0 font-bold text-gray-900 text-sm">{incident.title}</h3>
                    </div>
                    <div className={`badge ${config.badge} gap-1 whitespace-nowrap`}>
                      {severity.toUpperCase()}
                    </div>
                  </div>

                  <div className="ml-6 space-y-1.5">
                    <p className="m-0 text-xs text-gray-600">
                      <span className="font-semibold text-gray-700">Business Impact:</span> {incident.businessImpact}
                    </p>
                    <p className="m-0 text-xs text-gray-600">
                      <span className="font-semibold text-gray-700">Outcome:</span> {incident.outcome}
                    </p>
                    {incident.lessonsLearned && (
                      <p className="m-0 text-xs text-gray-600">
                        <span className="font-semibold text-gray-700">Lesson:</span> {incident.lessonsLearned}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
