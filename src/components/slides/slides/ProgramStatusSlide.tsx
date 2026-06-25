import { Report } from "@/types";
import { CheckCircle2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { usePrimaryColor } from "../slideConstants";

interface ProgramStatusSlideProps {
  report: Report;
}

const statusColor: Record<string, string> = {
  "on-track": "#065f46",
  "at-risk": "#9f1239",
  "at-critical-juncture": "#92400e",
};

const MAX_ITEMS = 5;

export default function ProgramStatusSlide({ report }: ProgramStatusSlideProps) {
  const t = useT();
  const accent = usePrimaryColor();
  const status = report.programStatus.status;
  const color = statusColor[status] || accent;
  const achievements = report.programStatus.achievements.filter(Boolean).slice(0, MAX_ITEMS);
  const challenges = report.programStatus.challenges.filter(Boolean).slice(0, MAX_ITEMS);

  return (
    <SlideFrame
      report={report}
      accent={accent}
      title={t("slide.program.title")}
      icon={CheckCircle2}
    >
      <div className="flex h-full flex-col gap-4">
        {/* Status */}
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-medium text-slate-500">
            {t("slide.program.statusLabel")}:
          </span>
          <span className="flex items-center gap-2 text-[15px] font-semibold" style={{ color }}>
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {t(`slide.status.${status}`)}
          </span>
        </div>

        {/* Two columns */}
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-5">
          <div>
            <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-slate-400">
              {t("slide.program.achievements")}
            </h3>
            {achievements.length === 0 ? (
              <p className="text-[15px] italic text-slate-400">{t("slide.program.noAchievements")}</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {achievements.map((item, idx) => (
                  <li key={idx} className="rounded-lg bg-slate-50 px-4 py-2.5 text-[15px] leading-snug text-slate-700">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-slate-400">
              {t("slide.program.challenges")}
            </h3>
            {challenges.length === 0 ? (
              <p className="text-[15px] italic text-slate-400">{t("slide.program.noChallenges")}</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {challenges.map((item, idx) => (
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
