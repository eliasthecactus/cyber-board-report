import { Report } from "@/types";
import { AlertTriangle, XCircle, Shield } from "lucide-react";
import styles from "../SlideRenderer.module.css";

interface ComplianceSlideProps {
  report: Report;
  compact?: boolean;
}

export default function ComplianceSlide({ report, compact: _compact = true }: ComplianceSlideProps) {
  const statusConfig: Record<string, {badge: string; bg: string; text: string}> = {
    compliant: { badge: "badge-success", bg: "bg-success/5 border-success/20", text: "text-success" },
    "compliant-with-exceptions": { badge: "badge-warning", bg: "bg-warning/5 border-warning/20", text: "text-warning" },
    "non-compliant": { badge: "badge-error", bg: "bg-error/5 border-error/20", text: "text-error" },
  };

  const config = statusConfig[report.complianceAudit.status] || statusConfig.compliant;

  return (
    <>
      <h2>Compliance & Audit Status</h2>
      <div className={styles.content}>
        {/* Status Header */}
        <div className={`alert ${config.bg} mb-6 rounded-lg border`}>
          <div className="flex items-center gap-3">
            <Shield size={24} className={`${config.text} shrink-0`} />
            <div>
              <div className="text-sm font-semibold text-gray-700">Compliance Status</div>
              <div className={`badge ${config.badge} text-uppercase gap-2 mt-1`}>
                {report.complianceAudit.status}
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Cards */}
        <div className={styles.twoColumn}>
          {/* Audit Findings */}
          <div className="card bg-warning/5 border border-warning/20 rounded-lg p-4">
            <div className="card-body p-0">
              <h3 className="flex items-center gap-2 text-warning font-bold mb-4">
                <AlertTriangle size={20} />
                Audit Findings
              </h3>
              {report.complianceAudit.findings.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No findings</p>
              ) : (
                <ul className="space-y-2.5 list-none pl-0">
                  {report.complianceAudit.findings.map((finding, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-warning font-bold text-lg mt-0">⚠</span>
                      <span className="text-gray-700 text-sm leading-snug">{finding}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Compliance Gaps */}
          <div className="card bg-error/5 border border-error/20 rounded-lg p-4">
            <div className="card-body p-0">
              <h3 className="flex items-center gap-2 text-error font-bold mb-4">
                <XCircle size={20} />
                Compliance Gaps
              </h3>
              {report.complianceAudit.gaps.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No gaps identified</p>
              ) : (
                <ul className="space-y-2.5 list-none pl-0">
                  {report.complianceAudit.gaps.map((gap, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-error font-bold text-lg mt-0">✕</span>
                      <span className="text-gray-700 text-sm leading-snug">{gap}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
