import { Report } from "@/types";
import { Link2, ShieldAlert } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { ACCENTS } from "../slideConstants";

interface SupplyChainSlideProps {
  report: Report;
}

const MAX_RISKS = 6;

export default function SupplyChainSlide({ report }: SupplyChainSlideProps) {
  const t = useT();
  const accent = ACCENTS.supplyChainRisk;
  const risks = report.supplyChainRisk.risks.filter(Boolean).slice(0, MAX_RISKS);

  return (
    <SlideFrame report={report} accent={accent} title={t("slide.supply.title")} icon={Link2}>
      <div className="grid h-full grid-cols-[1.2fr_1fr] gap-6">
        <div>
          <h3
            className="mb-3 flex items-center gap-2 text-[20px] font-bold"
            style={{ color: accent }}
          >
            <Link2 size={20} />
            {t("slide.supply.keyRisks")}
          </h3>
          {risks.length === 0 ? (
            <p className="text-[18px] italic text-slate-400">{t("slide.supply.none")}</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {risks.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-0.5 font-bold" style={{ color: accent }}>
                    →
                  </span>
                  <span className="text-[18px] leading-snug text-slate-700">{risk}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className="flex flex-col rounded-2xl border p-6"
          style={{ backgroundColor: `${accent}0D`, borderColor: `${accent}33` }}
        >
          <h3
            className="mb-3 flex items-center gap-2 text-[20px] font-bold"
            style={{ color: accent }}
          >
            <ShieldAlert size={20} />
            {t("slide.supply.assessment")}
          </h3>
          <p className="m-0 whitespace-pre-line text-[18px] leading-relaxed text-slate-700">
            {report.supplyChainRisk.assessment || t("slide.supply.noAssessment")}
          </p>
        </div>
      </div>
    </SlideFrame>
  );
}
