import { useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { AlertTriangle } from "lucide-react";
import type { Brief, BriefBlock, Report } from "@/types";
import { useT } from "@/lib/i18n";
import { BRIEF_COLS, BRIEF_GAP, BRIEF_ROWS, moveBlock, resizeBlock } from "@/lib/briefGrid";
import { SlideStage } from "@/components/slides/SlideStage";
import { blockDefinition } from "./blockRegistry";
import { BriefSlideView, gridTemplate } from "./BriefSlideView";

interface BriefCanvasProps {
  report: Report;
  prior: Report | null;
  brief: Brief;
  slideIndex: number;
  selectedId: string | null;
  /** Block id → problem text, for the warning badges. */
  warnings: Record<string, string>;
  onSelect: (id: string | null) => void;
  onBlocksChange: (blocks: BriefBlock[]) => void;
  onDelete: (id: string) => void;
  onOverflow: (blockId: string, overflowing: boolean) => void;
}

const CELLS = Array.from({ length: BRIEF_COLS * BRIEF_ROWS }, (_, index) => index);

/** The slide being edited: the real rendering plus handles for moving and resizing. */
export function BriefCanvas({
  report,
  prior,
  brief,
  slideIndex,
  selectedId,
  warnings,
  onSelect,
  onBlocksChange,
  onDelete,
  onOverflow,
}: BriefCanvasProps) {
  const t = useT();
  const gridRef = useRef<HTMLDivElement>(null);
  const blocks = brief.slides[slideIndex]?.blocks ?? [];

  const startPointer = (event: ReactPointerEvent, block: BriefBlock, mode: "move" | "resize") => {
    const grid = gridRef.current;
    if (!grid || event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onSelect(block.id);

    // offsetWidth ignores the CSS scale applied by SlideStage, getBoundingClientRect doesn't.
    const scale = grid.getBoundingClientRect().width / grid.offsetWidth;
    const cellWidth = ((grid.offsetWidth + BRIEF_GAP) / BRIEF_COLS) * scale;
    const cellHeight = ((grid.offsetHeight + BRIEF_GAP) / BRIEF_ROWS) * scale;
    const { clientX, clientY } = event;
    let current = blocks;

    const handleMove = (move: PointerEvent) => {
      const dx = Math.round((move.clientX - clientX) / cellWidth);
      const dy = Math.round((move.clientY - clientY) / cellHeight);
      // A rejected step keeps the last valid position.
      const next =
        mode === "move"
          ? moveBlock(current, block.id, block.x + dx, block.y + dy)
          : resizeBlock(current, block.id, block.w + dx, block.h + dy);
      if (next !== current) {
        current = next;
        onBlocksChange(next);
      }
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  };

  const handleKeyDown = (event: KeyboardEvent, block: BriefBlock) => {
    const step: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const delta = step[event.key];
    if (delta) {
      event.preventDefault();
      const [dx, dy] = delta;
      const next = event.shiftKey
        ? resizeBlock(blocks, block.id, block.w + dx, block.h + dy)
        : moveBlock(blocks, block.id, block.x + dx, block.y + dy);
      if (next !== blocks) {
        onBlocksChange(next);
      }
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onDelete(block.id);
    } else if (event.key === "Escape") {
      onSelect(null);
    }
  };

  const renderChrome = (block: BriefBlock) => {
    const selected = block.id === selectedId;
    const label = t(blockDefinition(block).label);
    const warning = warnings[block.id];
    return (
      <>
        <button
          type="button"
          aria-label={label}
          aria-pressed={selected}
          title={label}
          onPointerDown={(event) => startPointer(event, block, "move")}
          onClick={() => onSelect(block.id)}
          onKeyDown={(event) => handleKeyDown(event, block)}
          className={`absolute inset-0 cursor-move touch-none rounded-lg border-2 bg-transparent outline-none transition-colors ${
            selected ? "border-primary" : "border-transparent hover:border-slate-300 focus-visible:border-primary"
          }`}
        />
        {warning && (
          <span
            title={warning}
            className="pointer-events-none absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-amber-950"
          >
            <AlertTriangle size={12} aria-label={warning} />
          </span>
        )}
        {selected && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={t("brief.resize", { name: label })}
            onPointerDown={(event) => startPointer(event, block, "resize")}
            className="absolute -bottom-1 -right-1 h-4 w-4 cursor-nwse-resize touch-none rounded-sm border-2 border-white bg-primary"
          />
        )}
      </>
    );
  };

  const underlay = (
    <div aria-hidden className="absolute inset-0 grid" style={gridTemplate}>
      {CELLS.map((cell) => (
        <div key={cell} className="rounded bg-slate-50/70 outline-1 outline-dashed outline-slate-200" />
      ))}
    </div>
  );

  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      role="group"
      aria-label={t("brief.canvas", { number: slideIndex + 1 })}
      onPointerDown={() => onSelect(null)}
    >
      <SlideStage mode="width">
        <BriefSlideView
          report={report}
          prior={prior}
          brief={brief}
          slideIndex={slideIndex}
          gridRef={gridRef}
          underlay={underlay}
          renderChrome={renderChrome}
          onOverflow={onOverflow}
        />
      </SlideStage>
    </div>
  );
}
