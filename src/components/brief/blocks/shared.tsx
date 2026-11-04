import type { BriefBlockOf, BriefBlockType, Level, Report } from "@/types";
import { useT } from "@/lib/i18n";
import { levelColor } from "@/components/slides/palette";

export interface BlockProps<T extends BriefBlockType> {
  block: BriefBlockOf<T>;
  report: Report;
  /** The previous quarter's report, or null when there is none. */
  prior: Report | null;
}

export function Note({ children }: { children: string }) {
  return <p className="m-0 text-[12px] italic text-slate-400">{children}</p>;
}

export function NoData() {
  const t = useT();
  return <Note>{t("brief.block.noData")}</Note>;
}

/** "+2 more", for lists that show fewer items than exist. */
export function More({ shown, total }: { shown: number; total: number }) {
  const t = useT();
  if (total <= shown) {
    return null;
  }
  return <p className="m-0 text-[11px] text-slate-400">{t("brief.block.more", { count: total - shown })}</p>;
}

export function LevelLabel({ level }: { level: Level }) {
  const t = useT();
  return (
    <span className="whitespace-nowrap text-[11px] font-semibold" style={{ color: levelColor[level] }}>
      {t(`enum.${level}`)}
    </span>
  );
}
