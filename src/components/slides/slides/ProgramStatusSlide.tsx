import { Report } from "@/types";
import { CheckCircle2, AlertCircle } from "lucide-react";
import styles from "../SlideRenderer.module.css";

interface ProgramStatusSlideProps {
  report: Report;
  compact?: boolean;
}

export default function ProgramStatusSlide({
  report,
  compact: _compact = true,
}: ProgramStatusSlideProps) {
  const statusConfig: Record<string, {badge: string; bg: string}> = {
    "on-track": { badge: "badge-success", bg: "bg-success/10" },
    "at-risk": { badge: "badge-error", bg: "bg-error/10" },
    "at-critical-juncture": { badge: "badge-warning", bg: "bg-warning/10" },
  };

  const config = statusConfig[report.programStatus.status] || statusConfig["on-track"];

  return (
    <>
      <h2>Security Program Status</h2>
      <div className={styles.content}>
        <div className={`alert ${config.bg} mb-6 rounded-lg border border-opacity-20`}>
          <div className="flex items-center gap-3">
            <AlertCircle size={24} className="shrink-0" />
            <div>
              <div className="text-sm font-semibold text-gray-700">Program Status</div>
              <div className={`badge ${config.badge} text-uppercase gap-2 mt-1`}>
                {report.programStatus.status}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.twoColumn}>
          <div className="card bg-success/5 border border-success/20 rounded-lg p-4">
            <div className="card-body p-0">
              <h3 className="flex items-center gap-2 text-success font-bold mb-4">
                <CheckCircle2 size={20} />
                Achievements
              </h3>
              <ul className="space-y-2 list-none pl-0">
                {report.programStatus.achievements.map((achievement, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="text-success font-bold text-lg mt-0">✓</span>
                    <span className="text-gray-700 text-sm leading-snug">{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card bg-warning/5 border border-warning/20 rounded-lg p-4">
            <div className="card-body p-0">
              <h3 className="flex items-center gap-2 text-warning font-bold mb-4">
                <AlertCircle size={20} />
                Challenges
              </h3>
              <ul className="space-y-2 list-none pl-0">
                {report.programStatus.challenges.map((challenge, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="text-warning font-bold text-lg mt-0">⚠</span>
                    <span className="text-gray-700 text-sm leading-snug">{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
