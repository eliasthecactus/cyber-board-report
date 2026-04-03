import { Report } from "@/types";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import styles from "../SlideRenderer.module.css";

interface InitiativesSlideProps {
  report: Report;
  compact?: boolean;
}

export default function InitiativesSlide({ report, compact: _compact = true }: InitiativesSlideProps) {
  const statusConfig: Record<string, { color: string; badge: string; icon: any }> = {
    "on-track": { color: "#16a34a", badge: "badge-success", icon: CheckCircle2 },
    "at-risk": { color: "#ea580c", badge: "badge-warning", icon: AlertCircle },
    delayed: { color: "#dc2626", badge: "badge-error", icon: AlertCircle },
    "not-started": { color: "#6b7280", badge: "badge-ghost", icon: Clock },
  };

  return (
    <>
      <h2>Security Initiatives</h2>
      <div className={styles.content}>
        {report.initiatives.length === 0 ? (
          <p>No initiatives recorded</p>
        ) : (
          <div className="space-y-3">
            {report.initiatives.slice(0, 4).map((init) => {
              const config = statusConfig[init.status] || statusConfig["on-track"];
              const Icon = config.icon;
              return (
                <div key={init.id} className="bg-base-100 border border-base-300 rounded-lg p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="shrink-0 p-2 rounded-lg" style={{ background: config.color + "20" }}>
                        <Icon size={18} style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="m-0 font-semibold text-gray-900 text-sm leading-tight">{init.name}</h3>
                        {init.blockers && (
                          <p className="m-0 text-xs text-gray-600 mt-0.5">Blockers: {init.blockers}</p>
                        )}
                      </div>
                    </div>
                    <div className={`badge badge-sm ${config.badge} whitespace-nowrap shrink-0`}>
                      {init.status.replace("-", " ")}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <progress 
                        className="progress w-full h-1.5" 
                        value={init.progress} 
                        max="100"
                        style={{
                          "--value": init.progress,
                          "--size": "0.5rem",
                          "--track-color": "rgb(229, 231, 235)",
                          "--bar-color": config.color,
                        } as any}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-600 shrink-0 w-10 text-right">
                      {init.progress}%
                    </span>
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
