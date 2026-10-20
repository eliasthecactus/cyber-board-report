import { describe, expect, it } from "vitest";
import { normalizeReport } from "@/lib/reportFactory";
import { SLIDES, visibleSlides } from "./slideRegistry";

describe("visibleSlides", () => {
  it("shows every slide except optional ones by default", () => {
    const ids = visibleSlides(normalizeReport({})).map((slide) => slide.id);
    expect(ids).toHaveLength(SLIDES.length - 1);
    expect(ids).not.toContain("kpiExplanations");
  });

  it("adds the KPI explanations slide before the KPIs when enabled", () => {
    const report = normalizeReport({
      explainKpis: true,
      hideEmptySlides: true,
      kpis: [{ name: "Patch rate", value: 98, explanation: "Share of systems patched within 30 days" }],
    });
    expect(visibleSlides(report).map((slide) => slide.id)).toEqual(["title", "kpiExplanations", "kpis"]);
  });

  it("treats the KPI explanations slide as empty when no KPI is explained", () => {
    const report = normalizeReport({ explainKpis: true, hideEmptySlides: true, kpis: [{ name: "Patch rate" }] });
    expect(visibleSlides(report).map((slide) => slide.id)).toEqual(["title", "kpis"]);
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
