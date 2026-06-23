import { Report } from "@/types";
import { AlertTriangle, XCircle, ScrollText } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { ACCENTS } from "../slideConstants";

interface ComplianceSlideProps {
  report: Report;
}

const statusColor: Record<string, string> = {
  compliant: "#059669",
  "compliant-with-exceptions": "#d97706",
  "non-compliant": "#dc2626",
};

const MAX_ITEMS = 5;

export default function ComplianceSlide({ report }: ComplianceSlideProps) {
  const t = useT();
  const accent = ACCENTS.complianceAudit;
  const status = report.complianceAudit.status;
  const color = statusColor[status] || accent;
  const findings = report.complianceAudit.findings.filter(Boolean).slice(0, MAX_ITEMS);
  const gaps = report.complianceAudit.gaps.filter(Boolean).slice(0, MAX_ITEMS);

  return (
    <SlideFrame
      report={report}
      accent={accent}
      title={t("slide.compliance.title")}
      icon={ScrollText}
    >
      <div className="flex h-full flex-col gap-5">
        <div
          className="flex items-center gap-4 rounded-2xl border p-4"
          style={{ backgroundColor: `${color}0D`, borderColor: `${color}33` }}
        >
          <span className="text-[16px] font-semibold text-slate-500">
            {t("slide.compliance.statusLabel")}
          </span>
          <span
            className="rounded-full px-4 py-1.5 text-[16px] font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {t(`slide.compliance.statusValue.${status}`)}
          </span>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-6">
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-[19px] font-bold text-amber-700">
              <AlertTriangle size={20} />
              {t("slide.compliance.findings")}
            </h3>
            {findings.length === 0 ? (
              <p className="m-0 text-[16px] italic text-slate-400">
                {t("slide.compliance.noFindings")}
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {findings.map((item, idx) => (
                  <li key={idx} className="flex gap-2.5 text-[17px] leading-snug text-slate-700">
                    <span className="font-bold text-amber-600">⚠</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-[19px] font-bold text-red-700">
              <XCircle size={20} />
              {t("slide.compliance.gaps")}
            </h3>
            {gaps.length === 0 ? (
              <p className="m-0 text-[16px] italic text-slate-400">
                {t("slide.compliance.noGaps")}
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {gaps.map((item, idx) => (
                  <li key={idx} className="flex gap-2.5 text-[17px] leading-snug text-slate-700">
                    <span className="font-bold text-red-600">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}
