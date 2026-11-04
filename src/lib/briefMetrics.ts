import type { BriefBlockOptions, BriefMetric, Incident, Initiative, KPI, Level, Report, Risk } from "@/types";
import { riskKey } from "@/lib/brief";
import { riskScore, riskStats } from "@/components/slides/slides/TopRisksSlide";

const severityOrder: Level[] = ["low", "medium", "high", "critical"];

function isSerious(incident: Incident): boolean {
  return incident.severity === "high" || incident.severity === "critical";
}

export function needsAttention(initiative: Initiative): boolean {
  return initiative.status === "at-risk" || initiative.status === "delayed";
}

export function isOffTarget(kpi: KPI): boolean {
  if (kpi.targetValue === undefined) {
    return false;
  }
  return (kpi.direction ?? "higher") === "higher" ? kpi.value < kpi.targetValue : kpi.value > kpi.targetValue;
}

/** The value of a stat tile for one report. */
export function metricValue(metric: BriefMetric, report: Report): number {
  switch (metric) {
    case "criticalRisks":
      return riskStats(report).critical;
    case "worseningRisks":
      return riskStats(report).worsening;
    case "improvingRisks":
      return riskStats(report).improving;
    case "totalRisks":
      return report.topRisks.length;
    case "incidents":
      return report.incidents.length;
    case "seriousIncidents":
      return report.incidents.filter(isSerious).length;
    case "initiativesAtRisk":
      return report.initiatives.filter(needsAttention).length;
    case "kpisOffTarget":
      return report.kpis.filter(isOffTarget).length;
    case "openDecisions":
      return report.decisionsRequired.length;
  }
}

export interface RiskChange {
  name: string;
  /** Sum of likelihood and impact rank before and now; null when absent. */
  before: number | null;
  now: number | null;
}

export interface RiskMovement {
  added: RiskChange[];
  removed: RiskChange[];
  worsened: RiskChange[];
  improved: RiskChange[];
}

/**
 * What changed in the risk list since `prior`. Risks match by name because ids
 * don't survive copying a section between quarters. The score decides: the
 * `trend` field is the author's own judgement and may cover a different period.
 */
export function compareRisks(current: readonly Risk[], prior: readonly Risk[]): RiskMovement {
  const named = (risks: readonly Risk[]) => risks.filter((risk) => risk.name.trim());
  const priorByName = new Map(named(prior).map((risk) => [riskKey(risk.name), risk]));
  const currentNames = new Set(named(current).map((risk) => riskKey(risk.name)));
  const movement: RiskMovement = { added: [], removed: [], worsened: [], improved: [] };

  for (const risk of named(current)) {
    const before = priorByName.get(riskKey(risk.name));
    const now = riskScore(risk);
    if (!before) {
      movement.added.push({ name: risk.name, before: null, now });
    } else if (now > riskScore(before)) {
      movement.worsened.push({ name: risk.name, before: riskScore(before), now });
    } else if (now < riskScore(before)) {
      movement.improved.push({ name: risk.name, before: riskScore(before), now });
    }
  }
  for (const risk of named(prior)) {
    if (!currentNames.has(riskKey(risk.name))) {
      movement.removed.push({ name: risk.name, before: riskScore(risk), now: null });
    }
  }
  return movement;
}

/** The risks of a table block: the hand-picked ones, or else the top N by score. */
export function selectRisks(report: Report, options: BriefBlockOptions["riskTable"]): Risk[] {
  const picked = report.topRisks.filter((risk) => options.riskIds.includes(risk.id));
  const source = picked.length > 0 ? picked : report.topRisks;
  return [...source].sort((a, b) => riskScore(b) - riskScore(a)).slice(0, options.count);
}

/** The KPIs of a block: the hand-picked ones, or else the first N. */
export function selectKpis(report: Report, options: BriefBlockOptions["kpis"]): KPI[] {
  const picked = report.kpis.filter((kpi) => options.kpiIds.includes(kpi.id));
  return (picked.length > 0 ? picked : report.kpis).slice(0, options.count);
}

/** Incidents at or above the minimum severity, most severe first. */
export function selectIncidents(report: Report, options: BriefBlockOptions["incidents"]): Incident[] {
  const rank = (incident: Incident) => severityOrder.indexOf(incident.severity ?? "low");
  return report.incidents
    .filter((incident) => rank(incident) >= severityOrder.indexOf(options.minSeverity))
    .sort((a, b) => rank(b) - rank(a));
}

/** Initiatives after the filter, the ones needing attention first. */
export function selectInitiatives(report: Report, options: BriefBlockOptions["initiatives"]): Initiative[] {
  const source = options.filter === "needsAttention" ? report.initiatives.filter(needsAttention) : report.initiatives;
  return [...source].sort((a, b) => Number(needsAttention(b)) - Number(needsAttention(a)));
}
