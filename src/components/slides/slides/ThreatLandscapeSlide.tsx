import { Report } from "@/types";
import { AlertTriangle, Globe } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { ACCENTS } from "../slideConstants";

interface ThreatLandscapeSlideProps {
  report: Report;
}

const MAX_ITEMS = 5;

export default function ThreatLandscapeSlide({ report }: ThreatLandscapeSlideProps) {
  const t = useT();
  const accent = ACCENTS.threatLandscape;
  const sentences = (report.threatLandscape || "")
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const shown = sentences.slice(0, MAX_ITEMS);
  const remaining = sentences.length - shown.length;

  return (
    <SlideFrame report={report} accent={accent} title={t("slide.threat.title")} icon={Globe}>
      {!report.threatLandscape ? (
        <p className="text-[20px] text-slate-400">{t("slide.threat.none")}</p>
      ) : (
        <div className="flex h-full flex-col justify-center gap-3">
          {shown.map((sentence, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
              <AlertTriangle size={22} className="mt-0.5 shrink-0" style={{ color: accent }} />
              <p className="m-0 text-[19px] leading-snug text-slate-700">{sentence}</p>
            </div>
          ))}
          {remaining > 0 && (
            <p className="m-0 text-[15px] italic text-slate-400">
              {t("slide.threat.more", { count: remaining })}
            </p>
          )}
        </div>
      )}
    </SlideFrame>
  );
}
