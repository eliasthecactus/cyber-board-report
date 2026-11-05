import type { BriefBlockOf, BriefBlockType, Level, Report } from "@/types";
import { useT } from "@/lib/i18n";
import { withAlpha } from "@/lib/color";
import { useBriefTheme } from "../theme";

export interface BlockProps<T extends BriefBlockType> {
  block: BriefBlockOf<T>;
  report: Report;
  /** The previous quarter's report, or null when there is none. */
  prior: Report | null;
  /** Earlier reports, oldest first, ending with `prior`. */
  earlier: readonly Report[];
}

/** Pixel size of a block's content area, from its size in grid cells. */
function contentSize(block: { w: number; h: number }) {
  return { width: block.w * 101 - 42, height: block.h * 75 - 60 };
}

/** The largest of the text sizes at which `text` is expected to fit the block, so short text fills it. */
export function fittingTextSize(text: string, block: { w: number; h: number }): number {
  const { width, height } = contentSize(block);
  const fits = (size: number) => {
    const charsPerLine = width / (size * 0.5);
    const lines = text.split("\n").reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
    return lines * size * 1.5 <= height;
  };
  return [17, 15.5].find(fits) ?? 13.5;
}

export function Note({ children }: { children: string }) {
  return <p className="m-0 text-[12px] text-brief-muted">{children}</p>;
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
  return <p className="m-0 text-[11px] text-brief-muted">{t("brief.block.more", { count: total - shown })}</p>;
}

/** A coloured label on a tint of its own colour. */
export function Pill({ color, children }: { color: string; children: string }) {
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2 py-[3px] text-[10.5px] font-semibold leading-none"
      style={{ color, backgroundColor: withAlpha(color, 0.14) }}
    >
      {children}
    </span>
  );
}

export function LevelPill({ level }: { level: Level }) {
  const t = useT();
  const theme = useBriefTheme();
  return <Pill color={theme.level[level]}>{t(`enum.${level}`)}</Pill>;
}

const LEVEL_STEPS: Record<Level, number> = { low: 1, medium: 2, high: 3, critical: 4 };

/** The four-step scale as rising bars, with the word next to it. */
export function LevelMeter({ level }: { level: Level }) {
  const t = useT();
  const theme = useBriefTheme();
  const color = theme.level[level];
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span aria-hidden className="flex h-3 items-end gap-[2px]">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className="w-[3px] rounded-[1px]"
            style={{ height: 3 + step * 2.25, backgroundColor: step <= LEVEL_STEPS[level] ? color : theme.line }}
          />
        ))}
      </span>
      <span className="text-[11px] font-medium" style={{ color }}>
        {t(`enum.${level}`)}
      </span>
    </span>
  );
}
