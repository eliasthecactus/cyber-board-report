import { Report } from "@/types";
import { Link2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { usePrimaryColor } from "../slideConstants";

interface SupplyChainSlideProps {
  report: Report;
}

const MAX_RISKS = 6;

export default function SupplyChainSlide({ report }: SupplyChainSlideProps) {
  const t = useT();
  const accent = usePrimaryColor();
  const risks = report.supplyChainRisk.risks.filter(Boolean).slice(0, MAX_RISKS);

  return (
    <SlideFrame report={report} accent={accent} title={t("slide.supply.title")} icon={Link2}>
      <div className="grid h-full grid-cols-[1.2fr_1fr] gap-5">
        <div>
          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-slate-400">
            {t("slide.supply.keyRisks")}
          </h3>
          {risks.length === 0 ? (
            <p className="text-[15px] italic text-slate-400">{t("slide.supply.none")}</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {risks.map((risk, idx) => (
                <li key={idx} className="rounded-lg bg-slate-50 px-4 py-2.5 text-[16px] leading-snug text-slate-700">
                  {risk}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-slate-400">
            {t("slide.supply.assessment")}
          </h3>
          {report.supplyChainRisk.assessment ? (
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="m-0 whitespace-pre-line text-[16px] leading-relaxed text-slate-700">
                {report.supplyChainRisk.assessment}
              </p>
            </div>
          ) : (
            <p className="text-[15px] italic text-slate-400">{t("slide.supply.noAssessment")}</p>
          )}
        </div>
      </div>
    </SlideFrame>
  );
}
