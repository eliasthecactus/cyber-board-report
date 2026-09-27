import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { DomainItem, DomainTrend, Report } from "@/types";
import { useT, type MessageKey } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { palette } from "../palette";

interface DomainSlideProps {
  report: Report;
  items: DomainItem[];
  title: string;
  icon: LucideIcon;
  max: number;
  emptyKey: MessageKey;
  /** Show the trend label under each item (threat landscape). */
  showTrendLabel?: boolean;
}

export const trendIcon: Record<DomainTrend, LucideIcon> = {
  more: ArrowUpRight,
  stable: Minus,
  less: ArrowDownRight,
};

/**
 * Two-column grid of short items with a direction arrow. Shared by the threat
 * landscape and the process / human / technology slides. The arrow colour is
 * neutral: it shows direction, not good vs. bad.
 */
export default function DomainSlide({
  report,
  items,
  title,
  icon,
  max,
  emptyKey,
  showTrendLabel = false,
}: DomainSlideProps) {
  const t = useT();
  const visible = items.filter((item) => item.text.trim());
  const shown = visible.slice(0, max);
  const remaining = visible.length - shown.length;

  return (
    <SlideFrame report={report} title={title} icon={icon}>
      {visible.length === 0 ? (
        <p className="text-[15px] italic text-slate-400">{t(emptyKey)}</p>
      ) : (
        <div className="flex h-full flex-col justify-center gap-3">
          <div className="grid grid-cols-2 gap-3">
            {shown.map((item) => {
              const TrendIcon = trendIcon[item.trend];
              return (
                <div key={item.id} className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white"
                    style={{ color: palette.muted }}
                  >
                    <TrendIcon size={16} aria-hidden />
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
                    {showTrendLabel && (
                      <p
                        className="m-0 mt-1 text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: palette.muted }}
                      >
                        {t(`trend.${item.trend}`)}
                      </p>
                    )}
                  </div>
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
