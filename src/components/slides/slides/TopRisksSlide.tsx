import { Report } from "@/types";
import styles from "../SlideRenderer.module.css";

interface TopRisksSlideProps {
  report: Report;
  compact?: boolean;
}

export default function TopRisksSlide({ report, compact: _compact = true }: TopRisksSlideProps) {
  const riskLevels: Record<string, Record<string, string>> = {
    low: { low: "green", medium: "yellow", high: "orange", critical: "red" },
    medium: { low: "yellow", medium: "orange", high: "red", critical: "red" },
    high: { low: "orange", medium: "red", high: "red", critical: "red" },
    critical: { low: "red", medium: "red", high: "red", critical: "dark-red" },
  };

  const getRiskColor = (likelihood: string, impact: string) => {
    return riskLevels[likelihood]?.[impact] || "gray";
  };

  const getCriticalRisks = () => report.topRisks.filter((r) => 
    (r.likelihood === "critical" || r.businessImpact === "critical") ||
    (r.likelihood === "high" && r.businessImpact === "high")
  );

  // Calculate statistics
  const criticalCount = report.topRisks.filter(r => r.likelihood === "critical" || r.businessImpact === "critical").length;
  const worseningCount = report.topRisks.filter(r => r.trend === "worsening").length;
  const improvingCount = report.topRisks.filter(r => r.trend === "improving").length;

  return (
    <>
      <h2>Top Risks</h2>
      <div className={styles.content}>
        {report.topRisks.length === 0 ? (
          <p>No risks recorded</p>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="stat bg-red-50 rounded-lg p-3 border border-red-100">
                <div className="stat-title text-xs font-bold text-gray-700">Critical Risks</div>
                <div className="stat-value text-2xl font-bold text-red-600">{criticalCount}</div>
              </div>
              <div className="stat bg-orange-50 rounded-lg p-3 border border-orange-100">
                <div className="stat-title text-xs font-bold text-gray-700">Worsening</div>
                <div className="stat-value text-2xl font-bold text-orange-600">{worseningCount}</div>
              </div>
              <div className="stat bg-green-50 rounded-lg p-3 border border-green-100">
                <div className="stat-title text-xs font-bold text-gray-700">Improving</div>
                <div className="stat-value text-2xl font-bold text-green-600">{improvingCount}</div>
              </div>
            </div>

            {/* Risk List - Top 4 */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide mb-3 text-gray-700">Critical & High Priority</h3>
              <div className="space-y-2">
                {getCriticalRisks().slice(0, 4).map((risk) => (
                  <div
                    key={risk.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      getRiskColor(risk.likelihood, risk.businessImpact) === "red"
                        ? "bg-red-50 border-red-500"
                        : getRiskColor(risk.likelihood, risk.businessImpact) === "orange"
                        ? "bg-orange-50 border-orange-500"
                        : "bg-yellow-50 border-yellow-500"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="m-0 font-semibold text-sm">{risk.name}</h4>
                        <p className="m-0 text-xs text-gray-600 mt-0.5">{risk.description}</p>
                      </div>
                      <div className="flex gap-1.5 text-xs whitespace-nowrap">
                        <span className={`px-2 py-1 rounded font-semibold ${
                          risk.likelihood === "critical" ? "bg-red-200 text-red-800" :
                          risk.likelihood === "high" ? "bg-orange-200 text-orange-800" :
                          "bg-yellow-200 text-yellow-800"
                        }`}>L:{risk.likelihood[0].toUpperCase()}</span>
                        <span className={`px-2 py-1 rounded font-semibold ${
                          risk.businessImpact === "critical" ? "bg-red-200 text-red-800" :
                          risk.businessImpact === "high" ? "bg-orange-200 text-orange-800" :
                          "bg-yellow-200 text-yellow-800"
                        }`}>I:{risk.businessImpact[0].toUpperCase()}</span>
                        <span className={`px-2 py-1 rounded font-semibold ${
                          risk.trend === "worsening" ? "bg-red-100 text-red-700" :
                          risk.trend === "stable" ? "bg-blue-100 text-blue-700" :
                          "bg-green-100 text-green-700"
                        }`}>{risk.trend === "worsening" ? "↑" : risk.trend === "stable" ? "→" : "↓"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Matrix */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide mb-3 text-gray-700">Risk Distribution</h3>
              <div className="grid grid-cols-5 gap-1 text-center">
                {/* Header */}
                <div />
                {["Low", "Med", "High", "Crit"].map((imp) => (
                  <div key={imp} className="text-xs font-bold text-gray-600">{imp}</div>
                ))}
                {/* Rows */}
                {["low", "medium", "high", "critical"].map((likelihood) => (
                  <div key={likelihood} className="contents">
                    <div className="text-xs font-bold text-gray-600 py-1">{likelihood[0].toUpperCase()}</div>
                    {["low", "medium", "high", "critical"].map((impact) => {
                      const count = report.topRisks.filter(
                        (r) => r.likelihood === likelihood && r.businessImpact === impact
                      ).length;
                      const colors: Record<string, string> = {
                        "green": "bg-green-100 text-green-900",
                        "yellow": "bg-yellow-100 text-yellow-900",
                        "orange": "bg-orange-100 text-orange-900",
                        "red": "bg-red-100 text-red-900",
                        "gray": "bg-gray-100 text-gray-900",
                      };
                      return (
                        <div
                          key={`${likelihood}-${impact}`}
                          className={`p-2 rounded text-xs font-semibold ${colors[getRiskColor(likelihood, impact)]}`}
                        >
                          {count}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
