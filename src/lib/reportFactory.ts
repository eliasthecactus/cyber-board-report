import type { Report } from "@/types";

export const REPORT_SCHEMA_VERSION = 1;

export function createId(prefix = "report"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

interface CreateReportInput {
  quarter: string;
  year: number;
  createdBy: string;
  id?: string;
  now?: string;
}

export function createEmptyReport({
  quarter,
  year,
  createdBy,
  id = createId(),
  now = new Date().toISOString(),
}: CreateReportInput): Report {
  return {
    id,
    quarter,
    year,
    createdAt: now,
    updatedAt: now,
    createdBy,
    executiveSummary: "",
    executiveSummaryHighlight: "",
    topRisks: [],
    threatLandscape: "",
    kpis: [],
    incidents: [],
    programStatus: {
      status: "on-track",
      achievements: [],
      challenges: [],
    },
    budgetResources: {
      budget: "",
      allocation: "",
      constraints: "",
    },
    complianceAudit: {
      status: "compliant",
      findings: [],
      gaps: [],
    },
    supplyChainRisk: {
      risks: [],
      assessment: "",
    },
    initiatives: [],
    outlook: "",
    emergingRisks: [],
    decisionsRequired: [],
  };
}

export function cloneReport(report: Report, createdBy: string): Report {
  const now = new Date().toISOString();

  return normalizeReport({
    ...report,
    id: createId(),
    createdAt: now,
    updatedAt: now,
    createdBy,
  });
}

export function normalizeReport(input: Partial<Report>): Report {
  const fallback = createEmptyReport({
    quarter: input.quarter || currentQuarter(),
    year: Number.isFinite(input.year) ? Number(input.year) : new Date().getFullYear(),
    createdBy: input.createdBy || "Local User",
    id: input.id || createId(),
    now: input.createdAt || new Date().toISOString(),
  });

  return {
    ...fallback,
    ...input,
    id: input.id || fallback.id,
    quarter: input.quarter || fallback.quarter,
    year: Number(input.year || fallback.year),
    createdAt: input.createdAt || fallback.createdAt,
    updatedAt: input.updatedAt || fallback.updatedAt,
    createdBy: input.createdBy || fallback.createdBy,
    executiveSummary: input.executiveSummary || "",
    executiveSummaryHighlight: input.executiveSummaryHighlight || "",
    topRisks: Array.isArray(input.topRisks) ? input.topRisks : [],
    threatLandscape: input.threatLandscape || "",
    kpis: Array.isArray(input.kpis) ? input.kpis : [],
    incidents: Array.isArray(input.incidents) ? input.incidents : [],
    programStatus: {
      ...fallback.programStatus,
      ...(input.programStatus || {}),
      achievements: Array.isArray(input.programStatus?.achievements)
        ? input.programStatus.achievements
        : [],
      challenges: Array.isArray(input.programStatus?.challenges)
        ? input.programStatus.challenges
        : [],
    },
    budgetResources: {
      ...fallback.budgetResources,
      ...(input.budgetResources || {}),
    },
    complianceAudit: {
      ...fallback.complianceAudit,
      ...(input.complianceAudit || {}),
      findings: Array.isArray(input.complianceAudit?.findings)
        ? input.complianceAudit.findings
        : [],
      gaps: Array.isArray(input.complianceAudit?.gaps)
        ? input.complianceAudit.gaps
        : [],
    },
    supplyChainRisk: {
      ...fallback.supplyChainRisk,
      ...(input.supplyChainRisk || {}),
      risks: Array.isArray(input.supplyChainRisk?.risks)
        ? input.supplyChainRisk.risks
        : [],
    },
    initiatives: Array.isArray(input.initiatives) ? input.initiatives : [],
    outlook: input.outlook || "",
    emergingRisks: Array.isArray(input.emergingRisks) ? input.emergingRisks : [],
    decisionsRequired: Array.isArray(input.decisionsRequired)
      ? input.decisionsRequired
      : [],
  };
}

export function currentQuarter(date = new Date()): string {
  return `Q${Math.floor(date.getMonth() / 3) + 1}`;
}

export function reportSortValue(report: Report): string {
  const quarterRank = report.quarter.replace(/\D/g, "").padStart(2, "0");
  return `${report.year}-${quarterRank}-${report.updatedAt}`;
}
