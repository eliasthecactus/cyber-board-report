import { Report } from "@/types";
import { Link2, AlertTriangle } from "lucide-react";
import styles from "../SlideRenderer.module.css";

interface SupplyChainSlideProps {
  report: Report;
  compact?: boolean;
}

export default function SupplyChainSlide({ report, compact: _compact = true }: SupplyChainSlideProps) {
  return (
    <>
      <h2>Third-Party & Supply Chain Risk</h2>
      <div className={styles.content}>
        <div className="mb-5">
          <h3 className="flex items-center gap-2 text-orange-700 mb-3">
            <Link2 size={18} />
            Key Supply Chain Risks
          </h3>
          {report.supplyChainRisk.risks.length === 0 ? (
            <p className="text-gray-500 italic">No risks identified</p>
          ) : (
            <ul className="space-y-2 list-none pl-0">
              {report.supplyChainRisk.risks.map((risk, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-orange-600 font-bold mt-0.5">→</span>
                  <span className="text-gray-700">{risk}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
          <h3 className="flex items-center gap-2 text-blue-700 mb-2">
            <AlertTriangle size={18} />
            Assessment
          </h3>
          <p className="text-gray-700 m-0">{report.supplyChainRisk.assessment || "No assessment provided"}</p>
        </div>
      </div>
    </>
  );
}
