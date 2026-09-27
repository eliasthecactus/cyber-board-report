import type { Report } from "@/types";
import { Eye } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { SLIDE_LIMITS } from "../slideConstants";
import { levelColor } from "../palette";

interface OutlookSlideProps {
  report: Report;
}

export default function OutlookSlide({ report }: OutlookSlideProps) {
  const t = useT();
  const emergingRisks = report.emergingRisks
    .filter((risk) => risk.description.trim())
    .slice(0, SLIDE_LIMITS.emergingRisks);

  return (
    <SlideFrame report={report} title={t("slide.outlook.title")} icon={Eye}>
      <div className="flex h-full flex-col gap-5">
        {report.outlook ? (
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="m-0 whitespace-pre-line text-[18px] leading-relaxed text-slate-600">
              {report.outlook}
            </p>
          </div>
        ) : (
          <p className="text-[15px] italic text-slate-400">{t("slide.outlook.none")}</p>
        )}

        {emergingRisks.length > 0 && (
          <div>
            <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-slate-500">
              {t("slide.outlook.keyEmerging")}
            </h3>
            <div className="flex flex-col gap-2">
              {emergingRisks.map((risk, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-4 py-2.5"
                >
                  <span className="text-[16px] leading-snug text-slate-700">{risk.description}</span>
                  <span
                    className="shrink-0 rounded px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: levelColor[risk.impact] }}
                  >
                    {t(`enum.${risk.impact}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SlideFrame>
  );
}
