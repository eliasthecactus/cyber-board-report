import { Report } from "@/types";
import { FileText, Lightbulb } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { ACCENTS } from "../slideConstants";

interface ExecutiveSummarySlideProps {
  report: Report;
}

export default function ExecutiveSummarySlide({ report }: ExecutiveSummarySlideProps) {
  const t = useT();
  const accent = ACCENTS.executiveSummary;
  return (
    <SlideFrame
      report={report}
      accent={accent}
      title={t("section.executiveSummary")}
      icon={FileText}
    >
      <div className="flex h-full flex-col gap-6">
        {report.executiveSummaryHighlight && (
          <div
            className="flex items-start gap-4 rounded-2xl border p-6"
            style={{ backgroundColor: `${accent}0D`, borderColor: `${accent}33` }}
          >
            <Lightbulb size={28} className="mt-0.5 shrink-0" style={{ color: accent }} />
            <div>
              <h3 className="m-0 mb-1 text-[18px] font-bold" style={{ color: accent }}>
                {t("slide.exec.keyTakeaway")}
              </h3>
              <p className="m-0 text-[19px] leading-relaxed text-slate-700">
                {report.executiveSummaryHighlight}
              </p>
            </div>
          </div>
        )}
        <p className="m-0 whitespace-pre-line text-[21px] leading-relaxed text-slate-700">
          {report.executiveSummary || t("slide.exec.noSummary")}
        </p>
      </div>
    </SlideFrame>
  );
}
