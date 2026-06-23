import { Report } from "@/types";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { ACCENTS } from "../slideConstants";

interface ProgramStatusSlideProps {
  report: Report;
}

const statusColor: Record<string, string> = {
  "on-track": "#059669",
  "at-risk": "#dc2626",
  "at-critical-juncture": "#d97706",
};

const MAX_ITEMS = 5;

export default function ProgramStatusSlide({ report }: ProgramStatusSlideProps) {
  const t = useT();
  const accent = ACCENTS.programStatus;
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
      <div className="flex h-full flex-col gap-5">
        <div
          className="flex items-center gap-4 rounded-2xl border p-4"
          style={{ backgroundColor: `${color}0D`, borderColor: `${color}33` }}
        >
          <span className="text-[16px] font-semibold text-slate-500">
            {t("slide.program.statusLabel")}
          </span>
          <span
            className="rounded-full px-4 py-1.5 text-[16px] font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {t(`slide.status.${status}`)}
          </span>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-6">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-[19px] font-bold text-emerald-700">
              <CheckCircle2 size={20} />
              {t("slide.program.achievements")}
            </h3>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {achievements.map((item, idx) => (
                <li key={idx} className="flex gap-2.5 text-[17px] leading-snug text-slate-700">
                  <span className="font-bold text-emerald-600">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-[19px] font-bold text-amber-700">
              <AlertCircle size={20} />
              {t("slide.program.challenges")}
            </h3>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {challenges.map((item, idx) => (
                <li key={idx} className="flex gap-2.5 text-[17px] leading-snug text-slate-700">
                  <span className="font-bold text-amber-600">⚠</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}
