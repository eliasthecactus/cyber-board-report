import { Report } from "@/types";
import styles from "../SlideRenderer.module.css";

interface DecisionsSlideProps {
  report: Report;
  compact?: boolean;
}

export default function DecisionsSlide({ report, compact: _compact = true }: DecisionsSlideProps) {
  return (
    <>
      <h2>Decisions Required</h2>
      <div className={styles.content}>
        {report.decisionsRequired.length === 0 ? (
          <p className="text-gray-500">No decisions required</p>
        ) : (
          <div className="space-y-3">
            {report.decisionsRequired.slice(0, 4).map((decision, idx) => (
              <div
                key={decision.id}
                className="p-4 border-l-4 border-indigo-600 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-r-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <h3 className="m-0 font-bold text-indigo-950">
                    {decision.title}
                  </h3>
                </div>

                <div className="ml-11 space-y-1.5">
                  <p className="m-0 text-sm text-gray-800">
                    <span className="font-semibold text-indigo-700">Rationale:</span> {decision.rationale}
                  </p>
                  <p className="m-0 text-sm text-gray-800">
                    <span className="font-semibold text-indigo-700">Impact:</span> {decision.impact}
                  </p>
                </div>
              </div>
            ))}
            {report.decisionsRequired.length > 4 && (
              <p className="text-xs text-gray-500 text-center py-2">
                +{report.decisionsRequired.length - 4} more decision(s)
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
