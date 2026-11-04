import { describe, expect, it } from "vitest";
import type { BriefBlockOf, Report } from "@/types";
import { copyBriefFrom, createBlock, createDefaultBrief } from "./brief";
import { canPlace, MAX_BRIEF_SLIDES } from "./briefGrid";
import { translate } from "./i18n";
import { createEmptyReport, normalizeReport } from "./reportFactory";

const t = (key: Parameters<typeof translate>[1]) => translate("en", key);

function report(quarter: string, patch: Partial<Report> = {}): Report {
  return { ...createEmptyReport({ quarter, year: 2026, createdBy: "Ana" }), ...patch };
}

const risk = (id: string, name: string) => ({
  id,
  name,
  likelihood: "high" as const,
  businessImpact: "high" as const,
  trend: "stable" as const,
});

describe("createDefaultBrief", () => {
  const brief = createDefaultBrief(t);

  it("has 3 slides without overlapping blocks", () => {
    expect(brief.slides).toHaveLength(3);
    expect(brief.slides.length).toBeLessThanOrEqual(MAX_BRIEF_SLIDES);
    for (const slide of brief.slides) {
      slide.blocks.forEach((block, index) => {
        expect(canPlace(block, slide.blocks.slice(0, index))).toBe(true);
      });
    }
  });

  it("survives normalization unchanged", () => {
    expect(normalizeReport({ brief: structuredClone(brief) } as never).brief).toEqual(brief);
  });
});

describe("copyBriefFrom", () => {
  const table = createBlock("riskTable", { x: 0, y: 0, w: 8, h: 4 }, { riskIds: ["old-1", "old-2"] });
  const text = createBlock("text", { x: 8, y: 0, w: 4, h: 2 }, { text: "Unsere Einschätzung" });
  const source = report("Q2", {
    topRisks: [risk("old-1", "Ransomware"), risk("old-2", "Lieferkette")],
    brief: {
      title: "Bericht",
      audience: "VR",
      footerNote: "Vertraulich",
      slides: [{ id: "s1", title: "Lage", blocks: [table, text] }],
    },
  });
  const target = report("Q3", { topRisks: [risk("new-1", " ransomware ")] });

  it("returns null when the source has no brief", () => {
    expect(copyBriefFrom(report("Q1"), target)).toBeNull();
  });

  it("gives everything new ids and keeps layout and text", () => {
    const copy = copyBriefFrom(source, target);
    expect(copy?.audience).toBe("VR");
    expect(copy?.slides[0].id).not.toBe("s1");
    expect(copy?.slides[0].blocks[0].id).not.toBe(table.id);
    expect(copy?.slides[0].blocks[1]).toMatchObject({ x: 8, options: { text: "Unsere Einschätzung" } });
  });

  it("remaps picked risks by name and drops the ones that are gone", () => {
    const copied = copyBriefFrom(source, target)?.slides[0].blocks[0] as BriefBlockOf<"riskTable">;
    expect(copied.options.riskIds).toEqual(["new-1"]);
  });

  it("doesn't change the source brief", () => {
    copyBriefFrom(source, target);
    expect((source.brief?.slides[0].blocks[0] as BriefBlockOf<"riskTable">).options.riskIds).toEqual(["old-1", "old-2"]);
  });
});
