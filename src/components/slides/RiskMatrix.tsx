import type { Level, Risk } from "@/types";
import { useT } from "@/lib/i18n";
import { matrixCell, matrixTone } from "./palette";

export const LEVELS: Level[] = ["low", "medium", "high", "critical"];

interface RiskMatrixProps {
  risks: readonly Risk[];
  /** Height of one cell in px. */
  cellHeight?: number;
}

/** Likelihood × impact heat map with the number of risks per cell. */
export function RiskMatrix({ risks, cellHeight = 48 }: RiskMatrixProps) {
  const t = useT();
  const headers = [
    t("slide.risks.mLow"),
    t("slide.risks.mMed"),
    t("slide.risks.mHigh"),
    t("slide.risks.mCrit"),
  ];

  return (
    <div className="flex gap-1.5">
      <div className="relative flex w-4 items-center justify-center">
        <span
          className="absolute whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-slate-400"
          style={{ transform: "rotate(-90deg)", transformOrigin: "center center" }}
        >
          {t("ed.risks.likelihood")}
        </span>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="grid grid-cols-5 gap-1 text-center">
          <div />
          {headers.map((header) => (
            <div key={header} className="text-[11px] font-bold uppercase text-slate-400">
              {header}
            </div>
          ))}
          {LEVELS.map((likelihood, row) => (
            <div key={likelihood} className="contents">
              <div className="flex items-center justify-end pr-1 text-[11px] font-bold uppercase text-slate-400">
                {headers[row].charAt(0).toUpperCase()}
              </div>
              {LEVELS.map((impact) => {
                const count = risks.filter((r) => r.likelihood === likelihood && r.businessImpact === impact).length;
                const tone = matrixCell[matrixTone(likelihood, impact)];
                return (
                  <div
                    key={`${likelihood}-${impact}`}
                    className="flex items-center justify-center rounded text-[14px] font-semibold"
                    style={{ height: cellHeight, backgroundColor: tone.bg, color: tone.fg }}
                  >
                    {count || ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-5">
          <div />
          <div className="col-span-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t("ed.risks.impact")}
          </div>
        </div>
      </div>
    </div>
  );
}
