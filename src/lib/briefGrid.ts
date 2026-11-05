import type { BriefBlock, BriefBlockOptions, BriefBlockType, BriefRect } from "@/types";

/*
 * The board brief's layout grid. This file has no dependencies on report logic
 * so that `normalizeBrief` in reportFactory.ts can use it without an import
 * cycle.
 */

export const BRIEF_COLS = 12;
export const BRIEF_ROWS = 8;
export const BRIEF_GAP = 10;
export const MAX_BRIEF_SLIDES = 5;
/** Upper limit for the "number of items" option of a block. */
export const MAX_BLOCK_ITEMS = 12;

export interface BlockSpec<T extends BriefBlockType> {
  /** Default size in grid cells. */
  w: number;
  h: number;
  /** Smallest size the block can be resized to. */
  minW: number;
  minH: number;
  options: BriefBlockOptions[T];
  /** Allowed values of string options. */
  enums?: Record<string, readonly string[]>;
}

const LEVEL_VALUES = ["low", "medium", "high", "critical"] as const;

export const BLOCK_SPECS: { [T in BriefBlockType]: BlockSpec<T> } = {
  text: { w: 4, h: 2, minW: 2, minH: 1, options: { text: "" } },
  headline: {
    w: 12,
    h: 1,
    minW: 3,
    minH: 1,
    options: { source: "highlight" },
    enums: { source: ["highlight", "summary"] },
  },
  stat: {
    w: 3,
    h: 1,
    minW: 2,
    minH: 1,
    options: { metric: "criticalRisks" },
    enums: {
      metric: [
        "criticalRisks",
        "worseningRisks",
        "improvingRisks",
        "totalRisks",
        "incidents",
        "seriousIncidents",
        "initiativesAtRisk",
        "kpisOffTarget",
        "openDecisions",
      ],
    },
  },
  riskMatrix: { w: 4, h: 5, minW: 3, minH: 3, options: {} },
  riskTable: {
    w: 8,
    h: 4,
    minW: 4,
    minH: 2,
    options: {
      count: 5,
      riskIds: [],
      showRatings: true,
      showDescription: false,
      showMitigation: true,
      showOwner: true,
    },
  },
  riskMovement: {
    w: 5,
    h: 3,
    minW: 3,
    minH: 2,
    options: { showNew: true, showRemoved: true, showWorsened: true, showImproved: true },
  },
  riskTrend: { w: 4, h: 4, minW: 3, minH: 3, options: {} },
  kpis: {
    w: 6,
    h: 3,
    minW: 3,
    minH: 2,
    options: { count: 4, kpiIds: [], showChart: false, showTarget: true },
  },
  incidents: {
    w: 6,
    h: 3,
    minW: 3,
    minH: 2,
    options: { count: 3, minSeverity: "low", showOutcome: true },
    enums: { minSeverity: LEVEL_VALUES },
  },
  initiatives: {
    w: 6,
    h: 3,
    minW: 3,
    minH: 2,
    options: { count: 5, filter: "all" },
    enums: { filter: ["all", "needsAttention"] },
  },
  items: {
    w: 6,
    h: 3,
    minW: 3,
    minH: 2,
    options: { source: "threatLandscape", count: 5, showDetail: false },
    enums: { source: ["threatLandscape", "processItems", "humanItems", "technologyItems"] },
  },
  emergingRisks: { w: 5, h: 3, minW: 3, minH: 2, options: { count: 4 } },
  outlook: { w: 5, h: 3, minW: 3, minH: 2, options: {} },
  decisions: {
    w: 6,
    h: 3,
    minW: 3,
    minH: 2,
    options: { count: 4, showRationale: true },
  },
};

export const BRIEF_THEMES = ["midnight", "daylight"] as const;

export const BRIEF_BLOCK_TYPES = Object.keys(BLOCK_SPECS) as BriefBlockType[];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Fit a rectangle into the grid, honouring the block type's minimum size. */
export function clampRect(rect: BriefRect, type: BriefBlockType): BriefRect {
  const { minW, minH } = BLOCK_SPECS[type];
  const w = clamp(rect.w, minW, BRIEF_COLS);
  const h = clamp(rect.h, minH, BRIEF_ROWS);
  return {
    w,
    h,
    x: clamp(rect.x, 0, BRIEF_COLS - w),
    y: clamp(rect.y, 0, BRIEF_ROWS - h),
  };
}

function overlaps(a: BriefRect, b: BriefRect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** Whether `rect` lies on the grid without touching any block except `ignoreId`. */
export function canPlace(rect: BriefRect, blocks: readonly (BriefRect & { id: string })[], ignoreId?: string): boolean {
  const inBounds = rect.x >= 0 && rect.y >= 0 && rect.x + rect.w <= BRIEF_COLS && rect.y + rect.h <= BRIEF_ROWS;
  return inBounds && blocks.every((block) => block.id === ignoreId || !overlaps(rect, block));
}

/** The first free position for a block of this size, scanning row by row. */
export function findFreeSpot(w: number, h: number, blocks: readonly BriefBlock[]): { x: number; y: number } | null {
  for (let y = 0; y + h <= BRIEF_ROWS; y += 1) {
    for (let x = 0; x + w <= BRIEF_COLS; x += 1) {
      if (canPlace({ x, y, w, h }, blocks)) {
        return { x, y };
      }
    }
  }
  return null;
}

/** Find room for a new block, shrinking towards its minimum size when the slide is full. */
export function findPlacement(type: BriefBlockType, blocks: readonly BriefBlock[]): BriefRect | null {
  const { w, h, minW, minH } = BLOCK_SPECS[type];
  for (let height = h; height >= minH; height -= 1) {
    for (let width = w; width >= minW; width -= 1) {
      const spot = findFreeSpot(width, height, blocks);
      if (spot) {
        return { ...spot, w: width, h: height };
      }
    }
  }
  return null;
}

function replaceRect(blocks: BriefBlock[], id: string, build: (block: BriefBlock) => BriefRect): BriefBlock[] {
  const block = blocks.find((item) => item.id === id);
  if (!block) {
    return blocks;
  }
  const rect = clampRect(build(block), block.type);
  const unchanged = rect.x === block.x && rect.y === block.y && rect.w === block.w && rect.h === block.h;
  if (unchanged || !canPlace(rect, blocks, id)) {
    return blocks;
  }
  return blocks.map((item) => (item.id === id ? { ...item, ...rect } : item));
}

/** Move a block. Returns the same array when the target is taken. */
export function moveBlock(blocks: BriefBlock[], id: string, x: number, y: number): BriefBlock[] {
  return replaceRect(blocks, id, (block) => ({ x, y, w: block.w, h: block.h }));
}

/** Resize a block. Returns the same array when the new size would overlap. */
export function resizeBlock(blocks: BriefBlock[], id: string, w: number, h: number): BriefBlock[] {
  return replaceRect(blocks, id, (block) => ({ x: block.x, y: block.y, w, h }));
}
