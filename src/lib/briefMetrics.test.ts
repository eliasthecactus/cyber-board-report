import { describe, expect, it } from "vitest";
import type { KPI, Level, Report, Risk } from "@/types";
import { BLOCK_SPECS } from "./briefGrid";
import { compareRisks, isOffTarget, metricValue, selectIncidents, selectInitiatives, selectKpis, selectRisks } from "./briefMetrics";
import { createEmptyReport } from "./reportFactory";

const risk = (name: string, likelihood: Level, businessImpact: Level, patch: Partial<Risk> = {}): Risk => ({
  id: name,
  name,
  likelihood,
  businessImpact,
  trend: "stable",
  ...patch,
});

const kpi = (patch: Partial<KPI>): KPI => ({
  id: "k",
  name: "KPI",
  unit: "%",
  value: 50,
  trend: "stable",
  historicalData: [],
  ...patch,
});

const empty = (): Report => createEmptyReport({ quarter: "Q3", year: 2026, createdBy: "Ana" });

describe("compareRisks", () => {
  it("sorts risks into new, removed, worsened and improved", () => {
    const prior = [
      risk("Stays", "high", "high"),
      risk("Gets worse", "low", "medium"),
      risk("Gets better", "high", "critical"),
      risk("Gone", "low", "low"),
    ];
    const current = [
      risk("Stays", "high", "high"),
      risk("Gets worse", "high", "medium"),
      risk("Gets better", "medium", "medium"),
      risk("Fresh", "low", "low"),
    ];
    const movement = compareRisks(current, prior);
    expect(movement.added.map((r) => r.name)).toEqual(["Fresh"]);
    expect(movement.removed.map((r) => r.name)).toEqual(["Gone"]);
    expect(movement.worsened.map((r) => r.name)).toEqual(["Gets worse"]);
    expect(movement.improved.map((r) => r.name)).toEqual(["Gets better"]);
  });

  it("matches names regardless of case and spacing, and skips unnamed risks", () => {
    const movement = compareRisks([risk(" ransomware ", "low", "low"), risk("  ", "low", "low")], [risk("Ransomware", "low", "low")]);
    expect(movement).toEqual({ added: [], removed: [], worsened: [], improved: [] });
  });
});

describe("metricValue", () => {
  it("computes every metric the stat block offers", () => {
    const report: Report = {
      ...empty(),
      topRisks: [
        risk("A", "critical", "low", { trend: "worsening" }),
        risk("B", "low", "critical", { trend: "improving" }),
        risk("C", "low", "low"),
      ],
      incidents: [
        { id: "1", title: "", severity: "critical", businessImpact: "", outcome: "", lessonsLearned: "", quarter: "" },
        { id: "2", title: "", severity: "low", businessImpact: "", outcome: "", lessonsLearned: "", quarter: "" },
      ],
      initiatives: [
        { id: "1", name: "", status: "delayed", progress: 0 },
        { id: "2", name: "", status: "at-risk", progress: 0 },
        { id: "3", name: "", status: "on-track", progress: 0 },
      ],
      kpis: [kpi({ value: 50, targetValue: 90 }), kpi({ value: 95, targetValue: 90 })],
      decisionsRequired: [{ id: "1", title: "", rationale: "", impact: "" }],
    };
    const expected = {
      criticalRisks: 2,
      worseningRisks: 1,
      improvingRisks: 1,
      totalRisks: 3,
      incidents: 2,
      seriousIncidents: 1,
      initiativesAtRisk: 2,
      kpisOffTarget: 1,
      openDecisions: 1,
    };
    expect(Object.keys(expected).sort()).toEqual([...(BLOCK_SPECS.stat.enums?.metric ?? [])].sort());
    for (const [metric, value] of Object.entries(expected)) {
      expect(metricValue(metric as keyof typeof expected, report)).toBe(value);
    }
  });
});

describe("isOffTarget", () => {
  it("respects the KPI's direction and ignores KPIs without a target", () => {
    expect(isOffTarget(kpi({ value: 80, targetValue: 90 }))).toBe(true);
    expect(isOffTarget(kpi({ value: 80, targetValue: 90, direction: "lower" }))).toBe(false);
    expect(isOffTarget(kpi({ value: 95, targetValue: 90, direction: "lower" }))).toBe(true);
    expect(isOffTarget(kpi({ value: 90, targetValue: 90 }))).toBe(false);
    expect(isOffTarget(kpi({ value: 1 }))).toBe(false);
  });
});

describe("block selections", () => {
  const options = BLOCK_SPECS.riskTable.options;
  const report: Report = {
    ...empty(),
    topRisks: [risk("Low", "low", "low"), risk("Top", "critical", "critical"), risk("Mid", "high", "medium")],
  };

  it("takes the highest rated risks unless some are picked", () => {
    expect(selectRisks(report, { ...options, count: 2 }).map((r) => r.name)).toEqual(["Top", "Mid"]);
    expect(selectRisks(report, { ...options, riskIds: ["Low"] }).map((r) => r.name)).toEqual(["Low"]);
  });

  it("falls back to automatic when every picked risk is gone", () => {
    expect(selectRisks(report, { ...options, count: 1, riskIds: ["deleted"] }).map((r) => r.name)).toEqual(["Top"]);
  });

  it("picks KPIs by id, keeping the report's order", () => {
    const kpis = [kpi({ id: "a" }), kpi({ id: "b" }), kpi({ id: "c" })];
    const defaults = BLOCK_SPECS.kpis.options;
    expect(selectKpis({ ...empty(), kpis }, { ...defaults, count: 2 }).map((k) => k.id)).toEqual(["a", "b"]);
    expect(selectKpis({ ...empty(), kpis }, { ...defaults, kpiIds: ["c", "a"] }).map((k) => k.id)).toEqual(["a", "c"]);
  });

  it("filters incidents by severity, most severe first", () => {
    const incident = (id: string, severity: Level) => ({
      id,
      title: id,
      severity,
      businessImpact: "",
      outcome: "",
      lessonsLearned: "",
      quarter: "",
    });
    const incidents = [incident("low", "low"), incident("crit", "critical"), incident("high", "high")];
    const selected = selectIncidents({ ...empty(), incidents }, { ...BLOCK_SPECS.incidents.options, minSeverity: "high" });
    expect(selected.map((i) => i.id)).toEqual(["crit", "high"]);
  });

  it("lists initiatives needing attention first and can show only those", () => {
    const initiatives = [
      { id: "ok", name: "", status: "on-track" as const, progress: 0 },
      { id: "late", name: "", status: "delayed" as const, progress: 0 },
    ];
    const defaults = BLOCK_SPECS.initiatives.options;
    expect(selectInitiatives({ ...empty(), initiatives }, defaults).map((i) => i.id)).toEqual(["late", "ok"]);
    expect(
      selectInitiatives({ ...empty(), initiatives }, { ...defaults, filter: "needsAttention" }).map((i) => i.id),
    ).toEqual(["late"]);
  });
});
