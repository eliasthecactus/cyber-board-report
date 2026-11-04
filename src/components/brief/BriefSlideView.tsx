import { useLayoutEffect, useRef, type ComponentType, type ReactNode, type Ref } from "react";
import type { Brief, BriefBlock, BriefBlockType, Report } from "@/types";
import { useT } from "@/lib/i18n";
import { capitals } from "@/lib/utils";
import { BRIEF_COLS, BRIEF_GAP, BRIEF_ROWS } from "@/lib/briefGrid";
import { SlideFrame, SlidePageContext } from "@/components/slides/SlideFrame";
import { blockDefinition, blockHeading } from "./blockRegistry";
import type { BlockProps } from "./blocks/shared";

export const gridTemplate = {
  gridTemplateColumns: `repeat(${BRIEF_COLS}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${BRIEF_ROWS}, minmax(0, 1fr))`,
  gap: BRIEF_GAP,
} as const;

interface BlockFrameProps {
  block: BriefBlock;
  report: Report;
  prior: Report | null;
  chrome?: ReactNode;
  onOverflow?: (blockId: string, overflowing: boolean) => void;
}

function BlockFrame({ block, report, prior, chrome, onOverflow }: BlockFrameProps) {
  const t = useT();
  const bodyRef = useRef<HTMLDivElement>(null);
  const definition = blockDefinition(block);
  const Content = definition.component as unknown as ComponentType<BlockProps<BriefBlockType>>;
  const heading = blockHeading(block, t);

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
        className={`h-full overflow-hidden rounded-lg ${definition.surface === "card" ? "bg-slate-50 px-3 py-2" : ""}`}
      >
        {heading && (
          <h3 className="m-0 mb-1 text-[11px] font-bold tracking-wider text-slate-500">{capitals(heading)}</h3>
        )}
        <Content block={block} report={report} prior={prior} />
      </div>
      {chrome}
    </div>
  );
}

interface BriefSlideViewProps {
  report: Report;
  prior: Report | null;
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
  prior,
  brief,
  slideIndex,
  gridRef,
  underlay,
  renderChrome,
  onOverflow,
}: BriefSlideViewProps) {
  const t = useT();
  const slide = brief.slides[slideIndex];
  if (!slide) {
    return null;
  }
  return (
    <SlidePageContext.Provider value={{ page: slideIndex + 1, total: brief.slides.length }}>
      <SlideFrame
        report={report}
        variant="compact"
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
                prior={prior}
                chrome={renderChrome?.(block)}
                onOverflow={onOverflow}
              />
            ))}
          </div>
        </div>
      </SlideFrame>
    </SlidePageContext.Provider>
  );
}
