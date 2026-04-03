import { Report } from "@/types";
import { AlertTriangle } from "lucide-react";
import styles from "../SlideRenderer.module.css";

interface ThreatLandscapeSlideProps {
  report: Report;
  compact?: boolean;
}

export default function ThreatLandscapeSlide({
  report,
  compact = true,
}: ThreatLandscapeSlideProps) {
  const sentences = (report.threatLandscape || "").split(". ").filter((s) => s.trim());
  const maxItems = compact ? 3 : sentences.length; // Show all in full mode, 3 in compact

  return (
    <>
      <h2>Threat Landscape & External Threats</h2>
      <div className={styles.content}>
        {!report.threatLandscape ? (
          <p>No threat landscape assessment provided</p>
        ) : (
          <div className="space-y-4">
            {sentences.slice(0, maxItems).map((sentence, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-blue-600 shrink-0 mt-1">
                  <AlertTriangle size={20} />
                </div>
                <p className="m-0 text-sm leading-relaxed text-gray-800">
                  {sentence.trim()}
                  {idx !== sentences.length - 1 && idx !== maxItems - 1 && "."}
                </p>
              </div>
            ))}
            {sentences.length > maxItems && (
              <p className="text-xs text-gray-600 italic">...and {sentences.length - maxItems} more insight(s)</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
