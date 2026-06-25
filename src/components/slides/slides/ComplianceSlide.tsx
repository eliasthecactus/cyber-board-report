import { Report } from "@/types";
import { ScrollText } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { usePrimaryColor } from "../slideConstants";

interface ComplianceSlideProps {
  report: Report;
}

const statusColor: Record<string, string> = {
  compliant: "#065f46",
  "compliant-with-exceptions": "#92400e",
  "non-compliant": "#9f1239",
};

const MAX_ITEMS = 5;

export default function ComplianceSlide({ report }: ComplianceSlideProps) {
  const t = useT();
  const accent = usePrimaryColor();
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
      <div className="flex h-full flex-col gap-4">
        {/* Status */}
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-medium text-slate-500">
            {t("slide.compliance.statusLabel")}:
          </span>
          <span className="flex items-center gap-2 text-[15px] font-semibold" style={{ color }}>
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {t(`slide.compliance.statusValue.${status}`)}
          </span>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-5">
          <div>
            <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-slate-400">
              {t("slide.compliance.findings")}
            </h3>
            {findings.length === 0 ? (
              <p className="text-[15px] italic text-slate-400">
                {t("slide.compliance.noFindings")}
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {findings.map((item, idx) => (
                  <li key={idx} className="rounded-lg bg-slate-50 px-4 py-2.5 text-[15px] leading-snug text-slate-700">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-slate-400">
              {t("slide.compliance.gaps")}
            </h3>
            {gaps.length === 0 ? (
              <p className="text-[15px] italic text-slate-400">
                {t("slide.compliance.noGaps")}
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {gaps.map((item, idx) => (
                  <li key={idx} className="rounded-lg bg-slate-50 px-4 py-2.5 text-[15px] leading-snug text-slate-700">
                    {item}
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
