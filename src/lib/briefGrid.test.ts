import { describe, expect, it } from "vitest";
import type { BriefBlock } from "@/types";
import { BLOCK_SPECS, BRIEF_BLOCK_TYPES, canPlace, clampRect, findFreeSpot, findPlacement, moveBlock, resizeBlock } from "./briefGrid";

const stat = (id: string, x: number, y: number, w = 3, h = 1): BriefBlock => ({
  id,
  type: "stat",
  x,
  y,
  w,
  h,
  title: "",
  options: { metric: "criticalRisks" },
});

describe("canPlace", () => {
  const blocks = [stat("a", 0, 0)];

  it("rejects overlaps and positions off the grid", () => {
    expect(canPlace({ x: 2, y: 0, w: 2, h: 1 }, blocks)).toBe(false);
    expect(canPlace({ x: 11, y: 0, w: 2, h: 1 }, blocks)).toBe(false);
    expect(canPlace({ x: 0, y: 8, w: 2, h: 1 }, blocks)).toBe(false);
    expect(canPlace({ x: -1, y: 1, w: 2, h: 1 }, blocks)).toBe(false);
  });

  it("accepts touching blocks and ignores the block being moved", () => {
    expect(canPlace({ x: 3, y: 0, w: 2, h: 1 }, blocks)).toBe(true);
    expect(canPlace({ x: 1, y: 0, w: 3, h: 1 }, blocks, "a")).toBe(true);
  });
});

describe("clampRect", () => {
  it("keeps the block on the grid and at its minimum size", () => {
    expect(clampRect({ x: 20, y: 20, w: 1, h: 1 }, "riskMatrix")).toEqual({ x: 9, y: 5, w: 3, h: 3 });
    expect(clampRect({ x: -2, y: 0, w: 40, h: 40 }, "text")).toEqual({ x: 0, y: 0, w: 12, h: 8 });
  });
});

describe("moveBlock and resizeBlock", () => {
  const blocks = [stat("a", 0, 0), stat("b", 6, 0)];

  it("moves a block, clamped to the grid", () => {
    expect(moveBlock(blocks, "a", 2, 3)[0]).toMatchObject({ x: 2, y: 3 });
    expect(moveBlock(blocks, "a", -5, 99)[0]).toMatchObject({ x: 0, y: 7 });
  });

  it("returns the same array when the target is taken or nothing changes", () => {
    expect(moveBlock(blocks, "a", 5, 0)).toBe(blocks);
    expect(moveBlock(blocks, "a", 0, 0)).toBe(blocks);
    expect(moveBlock(blocks, "missing", 1, 1)).toBe(blocks);
  });

  it("resizes a block but not over its neighbour or below its minimum", () => {
    expect(resizeBlock(blocks, "a", 6, 2)[0]).toMatchObject({ w: 6, h: 2 });
    expect(resizeBlock(blocks, "a", 7, 1)).toBe(blocks);
    expect(resizeBlock(blocks, "a", 1, 1)[0]).toMatchObject({ w: 2, h: 1 });
  });
});

describe("placing new blocks", () => {
  it("finds the first free spot row by row", () => {
    expect(findFreeSpot(3, 1, [stat("a", 0, 0)])).toEqual({ x: 3, y: 0 });
    expect(findFreeSpot(12, 1, [stat("a", 0, 0)])).toEqual({ x: 0, y: 1 });
  });

  it("shrinks a block to fit and gives up on a full slide", () => {
    const leftColumn = [stat("a", 0, 0, 10, 8)];
    expect(findPlacement("text", leftColumn)).toEqual({ x: 10, y: 0, w: 2, h: 2 });
    expect(findPlacement("text", [stat("a", 0, 0, 12, 8)])).toBeNull();
  });
});

describe("BLOCK_SPECS", () => {
  it("has default sizes within the grid and above the minimum", () => {
    for (const type of BRIEF_BLOCK_TYPES) {
      const { w, h, minW, minH } = BLOCK_SPECS[type];
      expect(w).toBeGreaterThanOrEqual(minW);
      expect(h).toBeGreaterThanOrEqual(minH);
      expect(clampRect({ x: 0, y: 0, w, h }, type)).toEqual({ x: 0, y: 0, w, h });
    }
  });
});
