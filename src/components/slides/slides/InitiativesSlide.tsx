import type { Report } from "@/types";
import { Target } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { SLIDE_LIMITS } from "../slideConstants";
import { palette, statusColor } from "../palette";

interface InitiativesSlideProps {
  report: Report;
}

export default function InitiativesSlide({ report }: InitiativesSlideProps) {
  const t = useT();
  const initiatives = report.initiatives.slice(0, SLIDE_LIMITS.initiatives);
  const remaining = report.initiatives.length - initiatives.length;

  return (
    <SlideFrame report={report} title={t("slide.initiatives.title")} icon={Target}>
      {report.initiatives.length === 0 ? (
        <p className="text-[15px] italic text-slate-400">{t("slide.initiatives.none")}</p>
      ) : (
        <div className="flex h-full flex-col justify-center gap-3">
          <div className="grid grid-cols-2 gap-3">
            {initiatives.map((init) => {
              const color = statusColor[init.status];
              return (
                <div key={init.id} className="rounded-lg bg-slate-50 p-3.5">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="m-0 min-w-0 text-[15px] font-semibold leading-snug text-slate-900">
                      {init.name}
                    </h3>
                    <span
                      className="shrink-0 rounded px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: color }}
                    >
                      {t(`slide.status.${init.status}`)}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center gap-2.5">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${init.progress}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-[13px] font-bold text-slate-600 tabular-nums">
                      {init.progress}%
                    </span>
                  </div>
                  {init.statusNote && (
                    <p className="m-0 text-[12px] leading-snug text-slate-600">
                      {t("slide.initiatives.status", { text: init.statusNote })}
                    </p>
                  )}
                  {init.blockers && (
                    <p className="m-0 mt-0.5 text-[12px] leading-snug" style={{ color: palette.blocker }}>
                      {t("slide.initiatives.blockers", { text: init.blockers })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {remaining > 0 && (
            <p className="m-0 text-[14px] italic text-slate-400">
              {t("slide.more", { count: remaining })}
            </p>
          )}
        </div>
      )}
    </SlideFrame>
  );
}
