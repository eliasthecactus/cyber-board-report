import { describe, expect, it } from "vitest";
import { normalizeReport } from "./reportFactory";
import { findPriorReport, sectionPatch } from "./sectionImport";

const report = (quarter: string, year: number, extra = {}) => normalizeReport({ quarter, year, ...extra });

describe("section import", () => {
  it("finds the most recent earlier report", () => {
    const current = report("Q2", 2026);
    const candidates = [report("Q4", 2025), report("Q1", 2026), report("Q3", 2026), current];
    expect(findPriorReport(candidates, current)).toMatchObject({ quarter: "Q1", year: 2026 });
    expect(findPriorReport([current], current)).toBeNull();
  });

  it("copies items with fresh ids", () => {
    const source = report("Q1", 2026, { topRisks: [{ id: "risk_a", name: "Phishing" }] });
    const patch = sectionPatch("topRisks", source);
    expect(patch.topRisks?.[0].name).toBe("Phishing");
    expect(patch.topRisks?.[0].id).not.toBe("risk_a");
  });

  it("copies the outlook together with emerging risks", () => {
    const source = report("Q1", 2026, { outlook: "Calm", emergingRisks: [{ description: "AI", impact: "high" }] });
    expect(sectionPatch("outlook", source)).toEqual({
      outlook: "Calm",
      emergingRisks: [{ description: "AI", impact: "high" }],
    });
  });
});
