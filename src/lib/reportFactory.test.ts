import { describe, expect, it } from "vitest";
import { cloneReport, createEmptyReport, normalizeReport, REPORT_SCHEMA_VERSION } from "./reportFactory";

describe("normalizeReport", () => {
  it("fills every field for an empty object", () => {
    const report = normalizeReport({});
    expect(report.schemaVersion).toBe(REPORT_SCHEMA_VERSION);
    expect(report.id).toMatch(/^report_/);
    expect(report.quarter).toMatch(/^Q[1-4]$/);
    expect(report.topRisks).toEqual([]);
    expect(report.emergingRisks).toEqual([]);
    expect(report.hideEmptySlides).toBe(false);
    expect(report.showRiskMatrix).toBe(true);
    expect(report.explainKpis).toBe(false);
  });

  it("upgrades a schema 3 report without KPI explanations", () => {
    const report = normalizeReport({ schemaVersion: 3, kpis: [{ name: "MTTD", value: 4 }] } as never);
    expect(report.schemaVersion).toBe(REPORT_SCHEMA_VERSION);
    expect(report.explainKpis).toBe(false);
    expect(report.kpis[0].explanation).toBe("");
  });

  it("upgrades a schema 4 report without a brief or risk owners", () => {
    const report = normalizeReport({ schemaVersion: 4, topRisks: [{ name: "Ransomware" }] } as never);
    expect(report.schemaVersion).toBe(REPORT_SCHEMA_VERSION);
    expect(report.brief).toBeNull();
    expect(report.topRisks[0].mitigation).toBe("");
    expect(report.topRisks[0].owner).toBe("");
  });

  it("repairs a broken brief instead of passing it through", () => {
    const report = normalizeReport({
      brief: {
        title: 5,
        audience: "VR",
        slides: [
          {
            title: "One",
            blocks: [
              { type: "stat", x: 99, y: -3, w: 1, h: 50, options: { metric: "nonsense", extra: true } },
              { type: "riskTable", x: 0, y: 0, w: 4, h: 2, options: { count: 500, riskIds: ["a", 7], showOwner: "yes" } },
              { type: "riskTable", x: 1, y: 1, w: 4, h: 2 },
              { type: "unknown", x: 6, y: 6, w: 2, h: 2 },
            ],
          },
        ],
      },
    } as never);
    const blocks = report.brief?.slides[0].blocks ?? [];
    expect(report.brief?.title).toBe("");
    expect(report.brief?.audience).toBe("VR");
    expect(blocks.map((block) => block.type)).toEqual(["stat", "riskTable"]);
    expect(blocks[0]).toMatchObject({ x: 10, y: 0, w: 2, h: 8, options: { metric: "criticalRisks" } });
    expect(blocks[0].options).not.toHaveProperty("extra");
    expect(blocks[1].options).toMatchObject({ count: 12, riskIds: ["a"], showOwner: true });
  });

  it("treats a brief without slides as no brief", () => {
    expect(normalizeReport({ brief: { slides: [] } } as never).brief).toBeNull();
    expect(normalizeReport({ brief: "nonsense" } as never).brief).toBeNull();
  });

  it("round-trips a valid report unchanged", () => {
    const report = createEmptyReport({ quarter: "Q2", year: 2026, createdBy: "Ana", id: "r1", now: "2026-04-01T00:00:00.000Z" });
    expect(normalizeReport(structuredClone(report))).toEqual(report);
  });

  it("repairs malformed items instead of passing them through", () => {
    const report = normalizeReport({
      quarter: "Q9",
      year: "2025",
      topRisks: [{ name: "Ransomware", likelihood: "extreme", businessImpact: "high", trend: 7 }, "junk", null],
      kpis: [
        {
          name: "MTTD",
          value: "NaN",
          targetValue: null,
          historicalData: [{ quarter: "Q1 2025", value: 3 }, { quarter: "Q2-2025", value: "4" }, { quarter: "bad", value: 1 }],
        },
      ],
      incidents: [{ title: "Outage", severity: "sev1" }],
      initiatives: [{ name: "MFA", progress: 140, status: "done" }],
      emergingRisks: [{ description: "Deepfakes", impact: "enormous" }],
      decisionsRequired: [{ title: 5 }],
    } as never);

    expect(report.quarter).toMatch(/^Q[1-4]$/);
    expect(report.year).toBe(2025);
    expect(report.topRisks).toHaveLength(1);
    expect(report.topRisks[0]).toMatchObject({ likelihood: "low", businessImpact: "high", trend: "stable" });
    expect(report.topRisks[0]).not.toHaveProperty("historicalData");
    expect(report.kpis[0].value).toBe(0);
    expect(report.kpis[0].targetValue).toBeUndefined();
    expect(report.kpis[0].historicalData).toEqual([
      { quarter: "Q1-2025", value: 3 },
      { quarter: "Q2-2025", value: 4 },
    ]);
    expect(report.incidents[0].severity).toBe("medium");
    expect(report.initiatives[0]).toMatchObject({ progress: 100, status: "on-track" });
    expect(report.emergingRisks[0].impact).toBe("medium");
    expect(report.decisionsRequired[0].title).toBe("");
  });

  it("keeps a target of zero", () => {
    const report = normalizeReport({ kpis: [{ name: "Critical findings", value: 2, targetValue: 0 }] } as never);
    expect(report.kpis[0].targetValue).toBe(0);
  });

  it("migrates a schema 1 free-text threat landscape into items", () => {
    const report = normalizeReport({ threatLandscape: "Phishing is up. Ransomware stable.\nNew: supply chain" } as never);
    expect(report.threatLandscape.map((item) => item.text)).toEqual([
      "Phishing is up.",
      "Ransomware stable.",
      "New: supply chain",
    ]);
  });

  it("drops unknown top-level fields", () => {
    const report = normalizeReport({ evil: "<script>" } as never);
    expect(report).not.toHaveProperty("evil");
  });
});

describe("cloneReport", () => {
  it("creates an independent copy with a new id", () => {
    const original = normalizeReport({ quarter: "Q1", year: 2026, participants: ["A"] });
    const copy = cloneReport(original, "Bo");
    expect(copy.id).not.toBe(original.id);
    expect(copy.createdBy).toBe("Bo");
    copy.participants.push("B");
    expect(original.participants).toEqual(["A"]);
  });
});
