import { Report } from "@/types";
import { Zap, AlertTriangle, Eye } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { ACCENTS } from "../slideConstants";

interface OutlookSlideProps {
  report: Report;
}

const impactColor: Record<string, string> = {
  critical: "#dc2626",
  high: "#d97706",
  medium: "#2563eb",
  low: "#16a34a",
};

export default function OutlookSlide({ report }: OutlookSlideProps) {
  const t = useT();
  const accent = ACCENTS.outlook;
  const emergingRisks = (report.emergingRisks || []).slice(0, 4);

  return (
    <SlideFrame report={report} accent={accent} title={t("slide.outlook.title")} icon={Eye}>
      <div className="flex h-full flex-col gap-6">
        <p className="m-0 whitespace-pre-line text-[20px] leading-relaxed text-slate-700">
          {report.outlook || t("slide.outlook.none")}
        </p>

        {emergingRisks.length > 0 && (
          <div>
            <h3
              className="mb-3 flex items-center gap-2 text-[20px] font-bold"
              style={{ color: accent }}
            >
              <Zap size={22} />
              {t("slide.outlook.keyEmerging")}
            </h3>
            <div className="flex flex-col gap-2.5">
              {emergingRisks.map((risk, idx) => {
                const color = impactColor[risk.impact] || impactColor.medium;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 rounded-xl border-l-4 bg-slate-50 p-3.5"
                    style={{ borderColor: color }}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color }} />
                      <span className="text-[18px] leading-snug text-slate-700">
                        {risk.description}
                      </span>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-[13px] font-bold uppercase tracking-wide text-white"
                      style={{ backgroundColor: color }}
                    >
                      {t(`enum.${risk.impact}`)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </SlideFrame>
  );
}
