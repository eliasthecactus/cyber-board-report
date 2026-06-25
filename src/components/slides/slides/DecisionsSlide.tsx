import { Report } from "@/types";
import { Gavel } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { usePrimaryColor } from "../slideConstants";

interface DecisionsSlideProps {
  report: Report;
}

const MAX_DECISIONS = 4;

export default function DecisionsSlide({ report }: DecisionsSlideProps) {
  const t = useT();
  const accent = usePrimaryColor();
  const decisions = report.decisionsRequired.slice(0, MAX_DECISIONS);
  const remaining = report.decisionsRequired.length - decisions.length;

  return (
    <SlideFrame
      report={report}
      accent={accent}
      title={t("section.decisionsRequired")}
      icon={Gavel}
    >
      {report.decisionsRequired.length === 0 ? (
        <p className="text-[15px] italic text-slate-400">{t("slide.decisions.none")}</p>
      ) : (
        <div className="flex h-full flex-col justify-center gap-3">
          {decisions.map((decision, idx) => (
            <div key={decision.id} className="rounded-lg bg-slate-50 p-4">
              <div className="mb-1.5 flex items-center gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[13px] font-bold text-white"
                  style={{ backgroundColor: accent }}
                >
                  {idx + 1}
                </span>
                <h3 className="m-0 text-[18px] font-bold text-slate-900">{decision.title}</h3>
              </div>
              <div className="ml-10 flex flex-col gap-1 text-[15px] text-slate-600">
                <p className="m-0">
                  <span className="font-semibold text-slate-700">
                    {t("slide.decisions.rationale")}
                  </span>{" "}
                  {decision.rationale}
                </p>
                <p className="m-0">
                  <span className="font-semibold text-slate-700">
                    {t("slide.decisions.impact")}
                  </span>{" "}
                  {decision.impact}
                </p>
              </div>
            </div>
          ))}
          {remaining > 0 && (
            <p className="m-0 text-center text-[14px] text-slate-400">
              {t("slide.decisions.more", { count: remaining })}
            </p>
          )}
        </div>
      )}
    </SlideFrame>
  );
}
