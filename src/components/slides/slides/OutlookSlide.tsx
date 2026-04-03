import { Report } from "@/types";
import { Zap, AlertTriangle } from "lucide-react";
import styles from "../SlideRenderer.module.css";

interface OutlookSlideProps {
  report: Report;
  compact?: boolean;
}

export default function OutlookSlide({ report, compact: _compact = true }: OutlookSlideProps) {
  const emergingRisks = report.emergingRisks || [];

  const impactConfig: Record<string, {badge: string; bg: string}> = {
    critical: { badge: "badge-error", bg: "bg-error/10 border-error/30" },
    high: { badge: "badge-warning", bg: "bg-warning/10 border-warning/30" },
    medium: { badge: "badge-info", bg: "bg-info/10 border-info/30" },
    low: { badge: "badge-success", bg: "bg-success/10 border-success/30" },
  };

  return (
    <>
      <h2>Outlook & Emerging Risks</h2>
      <div className={styles.content}>
        <p className="leading-relaxed text-gray-800 mb-6">
          {report.outlook || "No outlook provided"}
        </p>

        {emergingRisks.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-amber-700 font-bold mb-4">
              <Zap size={20} />
              Key Emerging Risks
            </h3>
            <div className="space-y-2.5">
              {emergingRisks.slice(0, 3).map((risk, idx) => {
                const config = impactConfig[risk.impact] || impactConfig.medium;
                return (
                  <div key={idx} className={`card bg-base-100 border-l-4 border-opacity-50 rounded-lg p-3 ${config.bg}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                        <span className="text-sm text-gray-800 leading-snug">{risk.description}</span>
                      </div>
                      <div className={`badge ${config.badge} gap-1 whitespace-nowrap text-xs`}>
                        {risk.impact.toUpperCase()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
