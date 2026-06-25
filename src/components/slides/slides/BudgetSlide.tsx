import { Report } from "@/types";
import { DollarSign } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { usePrimaryColor } from "../slideConstants";

interface BudgetSlideProps {
  report: Report;
}

export default function BudgetSlide({ report }: BudgetSlideProps) {
  const t = useT();
  const accent = usePrimaryColor();
  const { budget, allocation, constraints } = report.budgetResources;

  const items = [
    {
      label: t("slide.budget.budget"),
      value: budget,
      placeholder: t("slide.budget.notSpecified"),
      large: true,
    },
    {
      label: t("slide.budget.allocation"),
      value: allocation,
      placeholder: t("slide.budget.notSpecified"),
      large: false,
    },
    {
      label: t("slide.budget.constraints"),
      value: constraints,
      placeholder: t("slide.budget.noneNoted"),
      large: false,
    },
  ];

  return (
    <SlideFrame
      report={report}
      accent={accent}
      title={t("section.budgetResources")}
      icon={DollarSign}
    >
      <div className="flex h-full flex-col justify-center gap-4">
        {items.map((item) => (
          <div key={item.label}>
            <h3 className="m-0 mb-2 text-[13px] font-bold uppercase tracking-wider text-slate-400">
              {item.label}
            </h3>
            {item.value ? (
              <div className="rounded-lg bg-slate-50 p-4">
                <p
                  className={`m-0 leading-snug text-slate-700 ${
                    item.large ? "text-[26px] font-bold" : "text-[17px]"
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ) : (
              <p className="text-[15px] italic text-slate-400">{item.placeholder}</p>
            )}
          </div>
        ))}
      </div>
    </SlideFrame>
  );
}
