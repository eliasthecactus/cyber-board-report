import { Report } from "@/types";
import { Target } from "lucide-react";
import { BarChart, Bar, XAxis, Cell, ResponsiveContainer } from "recharts";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { usePrimaryColor } from "../slideConstants";

interface InitiativesSlideProps {
  report: Report;
}

const statusColor: Record<string, string> = {
  "on-track": "#065f46",
  "at-risk": "#92400e",
  delayed: "#9f1239",
  "not-started": "#94a3b8",
};

const MAX_INITIATIVES = 5;

export default function InitiativesSlide({ report }: InitiativesSlideProps) {
  const t = useT();
  const accent = usePrimaryColor();
  const initiatives = report.initiatives.slice(0, MAX_INITIATIVES);

  const statusCounts = {
    "on-track": report.initiatives.filter((i) => i.status === "on-track").length,
    "at-risk": report.initiatives.filter((i) => i.status === "at-risk").length,
    delayed: report.initiatives.filter((i) => i.status === "delayed").length,
    "not-started": report.initiatives.filter((i) => i.status === "not-started").length,
  };
  const chartData = Object.entries(statusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: t(`slide.status.${status}`),
      value: count,
      color: statusColor[status] || "#94a3b8",
    }));

  return (
    <SlideFrame report={report} accent={accent} title={t("slide.initiatives.title")} icon={Target}>
      {report.initiatives.length === 0 ? (
        <p className="text-[15px] italic text-slate-400">{t("slide.initiatives.none")}</p>
      ) : (
        <div className="flex h-full min-h-0 gap-4 overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
            {initiatives.map((init) => {
              const color = statusColor[init.status] || statusColor["on-track"];
              return (
                <div key={init.id} className="rounded-lg bg-slate-50 p-3.5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="m-0 truncate text-[15px] font-semibold text-slate-900">
                        {init.name}
                      </h3>
                      {init.blockers && (
                        <p className="m-0 truncate text-[12px] text-slate-500">
                          {t("slide.initiatives.blockers", { text: init.blockers })}
                        </p>
                      )}
                    </div>
                    <span
                      className="shrink-0 rounded px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: color }}
                    >
                      {t(`slide.status.${init.status}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
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
                </div>
              );
            })}
          </div>

          {chartData.length > 0 && (
            <div className="flex w-[170px] min-w-[170px] shrink-0 flex-col items-center justify-center rounded-lg bg-slate-50 p-3">
              <p className="m-0 mb-2 text-[13px] font-bold uppercase tracking-wider text-slate-400">
                {t("slide.initiatives.title")}
              </p>
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 6, left: 0, bottom: 4 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="m-0 mt-1 text-[20px] font-bold text-slate-900">
                {report.initiatives.length}
              </p>
              <p className="m-0 text-[11px] uppercase tracking-wider text-slate-400">Total</p>
            </div>
          )}
        </div>
      )}
    </SlideFrame>
  );
}
