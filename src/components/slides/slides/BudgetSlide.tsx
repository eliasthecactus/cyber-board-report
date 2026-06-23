import { Report } from "@/types";
import { DollarSign, Users, AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { ACCENTS } from "../slideConstants";

interface BudgetSlideProps {
  report: Report;
}

export default function BudgetSlide({ report }: BudgetSlideProps) {
  const t = useT();
  const accent = ACCENTS.budgetResources;
  const { budget, allocation, constraints } = report.budgetResources;

  const cards = [
    {
      icon: DollarSign,
      label: t("slide.budget.budget"),
      value: budget || t("slide.budget.notSpecified"),
      color: "#16a34a",
      big: true,
    },
    {
      icon: Users,
      label: t("slide.budget.allocation"),
      value: allocation || t("slide.budget.notSpecified"),
      color: "#2563eb",
      big: false,
    },
    {
      icon: AlertCircle,
      label: t("slide.budget.constraints"),
      value: constraints || t("slide.budget.noneNoted"),
      color: constraints ? "#dc2626" : "#94a3b8",
      big: false,
    },
  ];

  return (
    <SlideFrame
      report={report}
      accent={accent}
      title={t("section.budgetResources")}
      icon={DollarSign}
    >
      <div className="grid h-full grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50 p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: card.color }}
                >
                  <Icon size={22} />
                </span>
                <h3 className="m-0 text-[15px] font-bold uppercase tracking-wide text-slate-500">
                  {card.label}
                </h3>
              </div>
              <p
                className={`m-0 leading-snug text-slate-800 ${
                  card.big ? "text-[30px] font-bold" : "text-[19px]"
                }`}
                style={card.big ? { color: card.color } : undefined}
              >
                {card.value}
              </p>
            </div>
          );
        })}
      </div>
    </SlideFrame>
  );
}
