import { Report } from "@/types";
import { Lightbulb } from "lucide-react";
import styles from "../SlideRenderer.module.css";

interface ExecutiveSummarySlideProps {
  report: Report;
  compact?: boolean;
}

export default function ExecutiveSummarySlide({
  report,
  compact: _compact = true,
}: ExecutiveSummarySlideProps) {
  return (
    <>
      <h2>Executive Summary</h2>
      <div className={styles.content}>
        {report.executiveSummaryHighlight && (
          <div className="alert bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 mb-6 rounded-lg">
            <div className="flex items-start gap-3">
              <Lightbulb size={24} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="m-0 font-bold text-blue-900 mb-1">Key Takeaway</h3>
                <p className="m-0 text-sm text-blue-800">
                  {report.executiveSummaryHighlight}
                </p>
              </div>
            </div>
          </div>
        )}
        <p className="text-base leading-relaxed text-gray-800">
          {report.executiveSummary || "No summary provided"}
        </p>
      </div>
    </>
  );
}
