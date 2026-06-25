import { Report } from "@/types";
import { Globe } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { usePrimaryColor } from "../slideConstants";

interface ThreatLandscapeSlideProps {
  report: Report;
}

const MAX_ITEMS = 5;

export default function ThreatLandscapeSlide({ report }: ThreatLandscapeSlideProps) {
  const t = useT();
  const accent = usePrimaryColor();
  const sentences = (report.threatLandscape || "")
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const shown = sentences.slice(0, MAX_ITEMS);
  const remaining = sentences.length - shown.length;

  return (
    <SlideFrame report={report} accent={accent} title={t("slide.threat.title")} icon={Globe}>
      {!report.threatLandscape ? (
        <p className="text-[15px] italic text-slate-400">{t("slide.threat.none")}</p>
      ) : (
        <div className="flex h-full flex-col justify-center gap-2.5">
          {shown.map((sentence, idx) => (
            <div key={idx} className="rounded-lg bg-slate-50 p-4">
              <p className="m-0 text-[17px] leading-snug text-slate-700">{sentence}</p>
            </div>
          ))}
          {remaining > 0 && (
            <p className="m-0 text-[14px] italic text-slate-400">
              {t("slide.threat.more", { count: remaining })}
            </p>
          )}
        </div>
      )}
    </SlideFrame>
  );
}
