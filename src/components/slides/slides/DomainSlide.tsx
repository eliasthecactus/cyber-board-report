import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { DomainItem, DomainTrend, Report } from "@/types";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { usePrimaryColor } from "../slideConstants";

interface DomainSlideProps {
  report: Report;
  items: DomainItem[];
  title: string;
  icon: LucideIcon;
}

const MAX_ITEMS = 6;

const trendIcon: Record<DomainTrend, typeof Minus> = {
  more: ArrowUpRight,
  stable: Minus,
  less: ArrowDownRight,
};

// Neutral color: the arrow conveys direction; we don't imply good vs. bad.
const TREND_COLOR = "#64748b";

export default function DomainSlide({ report, items, title, icon }: DomainSlideProps) {
  const t = useT();
  const accent = usePrimaryColor();
  const visible = items.filter((item) => item.text.trim());
  const shown = visible.slice(0, MAX_ITEMS);
  const remaining = visible.length - shown.length;

  return (
    <SlideFrame report={report} accent={accent} title={title} icon={icon}>
      {visible.length === 0 ? (
        <p className="text-[15px] italic text-slate-400">{t("slide.domain.none")}</p>
      ) : (
        <div className="flex h-full flex-col justify-center gap-3">
          <div className="grid grid-cols-2 gap-3">
            {shown.map((item) => {
              const TrendIcon = trendIcon[item.trend];
              return (
                <div key={item.id} className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white"
                    style={{ color: TREND_COLOR }}
                  >
                    <TrendIcon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="m-0 text-[15px] font-semibold leading-snug text-slate-900">
                      {item.text}
                    </p>
                    {item.detail && (
                      <p className="m-0 mt-0.5 text-[13px] leading-snug text-slate-600">
                        {item.detail}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {remaining > 0 && (
            <p className="m-0 text-[14px] italic text-slate-400">
              {t("slide.threat.more", { count: remaining })}
            </p>
          )}
        </div>
      )}
    </SlideFrame>
  );
}
