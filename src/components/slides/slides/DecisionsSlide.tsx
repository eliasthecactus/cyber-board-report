import { Report } from "@/types";
import { Gavel } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { ACCENTS } from "../slideConstants";

interface DecisionsSlideProps {
  report: Report;
}

const MAX_DECISIONS = 4;

export default function DecisionsSlide({ report }: DecisionsSlideProps) {
  const t = useT();
  const accent = ACCENTS.decisionsRequired;
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
        <p className="text-[20px] text-slate-400">{t("slide.decisions.none")}</p>
      ) : (
        <div className="flex h-full flex-col justify-center gap-3">
          {decisions.map((decision, idx) => (
            <div
              key={decision.id}
              className="rounded-xl border-l-4 bg-slate-50 p-4"
              style={{ borderColor: accent }}
            >
              <div className="mb-1.5 flex items-center gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[16px] font-bold text-white"
                  style={{ backgroundColor: accent }}
                >
                  {idx + 1}
                </span>
                <h3 className="m-0 text-[20px] font-bold text-slate-900">{decision.title}</h3>
              </div>
              <div className="ml-11 flex flex-col gap-1 text-[17px] text-slate-700">
                <p className="m-0">
                  <span className="font-semibold" style={{ color: accent }}>
                    {t("slide.decisions.rationale")}
                  </span>{" "}
                  {decision.rationale}
                </p>
                <p className="m-0">
                  <span className="font-semibold" style={{ color: accent }}>
                    {t("slide.decisions.impact")}
                  </span>{" "}
                  {decision.impact}
                </p>
              </div>
            </div>
          ))}
          {remaining > 0 && (
            <p className="m-0 text-center text-[15px] text-slate-400">
              {t("slide.decisions.more", { count: remaining })}
            </p>
          )}
        </div>
      )}
    </SlideFrame>
  );
}
