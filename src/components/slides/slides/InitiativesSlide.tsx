import { Report } from "@/types";
import { AlertCircle, CheckCircle2, Clock, Target } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { ACCENTS } from "../slideConstants";

interface InitiativesSlideProps {
  report: Report;
}

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  "on-track": { color: "#16a34a", icon: CheckCircle2 },
  "at-risk": { color: "#ea580c", icon: AlertCircle },
  delayed: { color: "#dc2626", icon: AlertCircle },
  "not-started": { color: "#6b7280", icon: Clock },
};

const MAX_INITIATIVES = 5;

export default function InitiativesSlide({ report }: InitiativesSlideProps) {
  const t = useT();
  const accent = ACCENTS.initiatives;
  const initiatives = report.initiatives.slice(0, MAX_INITIATIVES);

  return (
    <SlideFrame report={report} accent={accent} title={t("slide.initiatives.title")} icon={Target}>
      {report.initiatives.length === 0 ? (
        <p className="text-[20px] text-slate-400">{t("slide.initiatives.none")}</p>
      ) : (
        <div className="flex h-full flex-col justify-center gap-3">
          {initiatives.map((init) => {
            const config = statusConfig[init.status] || statusConfig["on-track"];
            const Icon = config.icon;
            return (
              <div
                key={init.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${config.color}20`, color: config.color }}
                    >
                      <Icon size={20} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="m-0 truncate text-[18px] font-semibold text-slate-900">
                        {init.name}
                      </h3>
                      {init.blockers && (
                        <p className="m-0 truncate text-[14px] text-slate-500">
                          {t("slide.initiatives.blockers", { text: init.blockers })}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold text-white"
                    style={{ backgroundColor: config.color }}
                  >
                    {t(`slide.status.${init.status}`)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${init.progress}%`, backgroundColor: config.color }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-[15px] font-bold text-slate-600 tabular-nums">
                    {init.progress}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SlideFrame>
  );
}
