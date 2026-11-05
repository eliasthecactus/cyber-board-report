import { useLayoutEffect, useRef, type ComponentType, type ReactNode, type Ref } from "react";
import type { Brief, BriefBlock, BriefBlockType, Report } from "@/types";
import { useT } from "@/lib/i18n";
import { withAlpha } from "@/lib/color";
import { capitals } from "@/lib/utils";
import { BRIEF_COLS, BRIEF_GAP, BRIEF_ROWS } from "@/lib/briefGrid";
import { useSettings } from "@/lib/settings";
import { SlidePageContext } from "@/components/slides/SlideFrame";
import { blockDefinition, blockHeading } from "./blockRegistry";
import { BriefFrame } from "./BriefFrame";
import type { BlockProps } from "./blocks/shared";
import { BriefThemeContext, heroVars, resolveTheme, useBriefTheme } from "./theme";

export const gridTemplate = {
  gridTemplateColumns: `repeat(${BRIEF_COLS}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${BRIEF_ROWS}, minmax(0, 1fr))`,
  gap: BRIEF_GAP,
} as const;

interface BlockFrameProps {
  block: BriefBlock;
  report: Report;
  earlier: readonly Report[];
  chrome?: ReactNode;
  onOverflow?: (blockId: string, overflowing: boolean) => void;
}

function BlockFrame({ block, report, earlier, chrome, onOverflow }: BlockFrameProps) {
  const t = useT();
  const theme = useBriefTheme();
  const bodyRef = useRef<HTMLDivElement>(null);
  const definition = blockDefinition(block);
  const Content = definition.component as unknown as ComponentType<BlockProps<BriefBlockType>>;
  const heading = blockHeading(block, t);
  const hero = definition.surface === "hero";
  const Icon = definition.Icon;

  // No dependencies on purpose: any change of data, options or size can affect the fit.
  useLayoutEffect(() => {
    if (!onOverflow) {
      return;
    }
    const measure = () => {
      const body = bodyRef.current;
      if (body) {
        onOverflow(block.id, body.scrollHeight > body.clientHeight + 1);
      }
    };
    measure();
    // The first measurement can happen before the web font has loaded.
    void document.fonts?.ready.then(measure);
  });

  return (
    <div
      className="relative min-h-0 min-w-0"
      style={{
        gridColumn: `${block.x + 1} / span ${block.w}`,
        gridRow: `${block.y + 1} / span ${block.h}`,
      }}
    >
      <div
        ref={bodyRef}
        className={`relative flex h-full flex-col overflow-hidden rounded-[14px] px-4 py-3 ${
          hero ? "" : "border border-brief-line bg-brief-tile"
        }`}
        style={
          hero
            ? {
                ...heroVars(theme),
                color: "var(--brief-body)",
                backgroundColor: theme.heroFill,
                backgroundImage: `linear-gradient(115deg, ${withAlpha(theme.heroInk, 0.12)}, ${withAlpha(theme.heroInk, 0)} 55%)`,
              }
            : undefined
        }
      >
        {heading && (
          <h3 className="m-0 mb-2 flex shrink-0 items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.1em] text-brief-muted">
            <Icon size={13} className="text-brief-accent" aria-hidden />
            {capitals(heading)}
          </h3>
        )}
        <div className="min-h-0 flex-1">
          <Content block={block} report={report} prior={earlier.at(-1) ?? null} earlier={earlier} />
        </div>
      </div>
      {chrome}
    </div>
  );
}

interface BriefSlideViewProps {
  report: Report;
  /** Earlier reports, oldest first, for comparisons and trends. */
  earlier: readonly Report[];
  brief: Brief;
  slideIndex: number;
  /** Editor only: the grid element, for converting pointer movement to cells. */
  gridRef?: Ref<HTMLDivElement>;
  /** Editor only: drawn behind the blocks. */
  underlay?: ReactNode;
  /** Editor only: drawn on top of each block. */
  renderChrome?: (block: BriefBlock) => ReactNode;
  onOverflow?: (blockId: string, overflowing: boolean) => void;
}

/** One slide of the brief. The editor and both PDF exports all render this. */
export function BriefSlideView({
  report,
  earlier,
  brief,
  slideIndex,
  gridRef,
  underlay,
  renderChrome,
  onOverflow,
}: BriefSlideViewProps) {
  const t = useT();
  const { settings } = useSettings();
  const slide = brief.slides[slideIndex];
  if (!slide) {
    return null;
  }
  return (
    <BriefThemeContext.Provider value={resolveTheme(brief.theme, settings.primaryColor)}>
      <SlidePageContext.Provider value={{ page: slideIndex + 1, total: brief.slides.length }}>
        <BriefFrame
          report={report}
          title={slide.title}
          eyebrow={brief.audience}
          footerTitle={brief.title.trim() || t("brief.defaultTitle")}
          footerNote={brief.footerNote}
        >
          <div className="relative h-full">
            {underlay}
            <div ref={gridRef} className="relative grid h-full" style={gridTemplate}>
              {slide.blocks.map((block) => (
                <BlockFrame
                  key={block.id}
                  block={block}
                  report={report}
                  earlier={earlier}
                  chrome={renderChrome?.(block)}
                  onOverflow={onOverflow}
                />
              ))}
            </div>
          </div>
        </BriefFrame>
      </SlidePageContext.Provider>
    </BriefThemeContext.Provider>
  );
}
