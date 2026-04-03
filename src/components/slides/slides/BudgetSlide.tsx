import { Report } from "@/types";
import { DollarSign, Users, AlertCircle } from "lucide-react";
import styles from "../SlideRenderer.module.css";

interface BudgetSlideProps {
  report: Report;
  compact?: boolean;
}

export default function BudgetSlide({ report, compact: _compact = true }: BudgetSlideProps) {
  return (
    <>
      <h2>Budget & Resources</h2>
      <div className={styles.content}>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-lg border border-green-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-green-600 rounded text-white">
                <DollarSign size={20} />
              </div>
              <h3 className="m-0 text-sm font-bold uppercase tracking-wide text-gray-700">Budget</h3>
            </div>
            <p className="m-0 text-2xl font-bold text-green-700">
              {report.budgetResources.budget || "Not specified"}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-600 rounded text-white">
                <Users size={20} />
              </div>
              <h3 className="m-0 text-sm font-bold uppercase tracking-wide text-gray-700">Allocation</h3>
            </div>
            <p className="m-0 text-sm leading-relaxed text-gray-800">
              {report.budgetResources.allocation || "Not specified"}
            </p>
          </div>

          <div className={`bg-gradient-to-br ${report.budgetResources.constraints ? "from-red-50 to-orange-50" : "from-gray-50 to-gray-100"} p-4 rounded-lg border ${report.budgetResources.constraints ? "border-red-200" : "border-gray-200"} shadow-sm`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 ${report.budgetResources.constraints ? "bg-red-600" : "bg-gray-600"} rounded text-white`}>
                <AlertCircle size={20} />
              </div>
              <h3 className="m-0 text-sm font-bold uppercase tracking-wide text-gray-700">Constraints</h3>
            </div>
            <p className={`m-0 text-sm leading-relaxed ${report.budgetResources.constraints ? "text-red-800 font-semibold" : "text-gray-600"}`}>
              {report.budgetResources.constraints || "None noted"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
