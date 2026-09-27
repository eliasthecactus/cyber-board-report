import { describe, expect, it } from "vitest";
import { normalizeReport } from "@/lib/reportFactory";
import { SLIDES, visibleSlides } from "./slideRegistry";

describe("visibleSlides", () => {
  it("shows every slide by default", () => {
    expect(visibleSlides(normalizeReport({}))).toHaveLength(SLIDES.length);
  });

  it("hides empty sections but always keeps the title slide", () => {
    const report = normalizeReport({
      hideEmptySlides: true,
      executiveSummary: "All good",
      kpis: [{ name: "Patch rate", value: 98 }],
    });
    expect(visibleSlides(report).map((slide) => slide.id)).toEqual(["title", "executiveSummary", "kpis"]);
  });

  it("reports when a section has more items than fit on its slide", () => {
    const report = normalizeReport({
      decisionsRequired: Array.from({ length: 6 }, (_, i) => ({ title: `D${i}` })),
    });
    const decisions = SLIDES.find((slide) => slide.id === "decisionsRequired");
    expect(decisions?.capacity?.(report)).toEqual({ total: 6, max: 4 });
  });
});
