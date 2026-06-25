import { Report } from "@/types";
import { FileText } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { usePrimaryColor } from "../slideConstants";

interface ExecutiveSummarySlideProps {
  report: Report;
}

export default function ExecutiveSummarySlide({ report }: ExecutiveSummarySlideProps) {
  const t = useT();
  const accent = usePrimaryColor();
  return (
    <SlideFrame
      report={report}
      accent={accent}
      title={t("section.executiveSummary")}
      icon={FileText}
    >
      <div className="flex h-full flex-col gap-5">
        {report.executiveSummaryHighlight && (
          <div className="rounded-lg bg-slate-50 p-5">
            <h3
              className="m-0 mb-1 text-[13px] font-bold uppercase tracking-wider"
              style={{ color: accent }}
            >
              {t("slide.exec.keyTakeaway")}
            </h3>
            <p className="m-0 text-[18px] leading-relaxed text-slate-700">
              {report.executiveSummaryHighlight}
            </p>
          </div>
        )}
        <p className="m-0 whitespace-pre-line text-[19px] leading-relaxed text-slate-600">
          {report.executiveSummary || t("slide.exec.noSummary")}
        </p>
      </div>
    </SlideFrame>
  );
}
