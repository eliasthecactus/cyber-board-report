import type { DomainItem, DomainTrend, Initiative, Report, ThreatItem } from "@/types";

export const REPORT_SCHEMA_VERSION = 2;

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
    title: "",
    presenter: "",
    participants: [],
    showRiskMatrix: true,
    executiveSummary: "",
    executiveSummaryHighlight: "",
    topRisks: [],
    threatLandscape: [],
    kpis: [],
    incidents: [],
    processItems: [],
    humanItems: [],
    technologyItems: [],
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

const TRENDS: DomainTrend[] = ["more", "stable", "less"];

function asTrend(value: unknown): DomainTrend {
  return TRENDS.includes(value as DomainTrend) ? (value as DomainTrend) : "stable";
}

/**
 * Accepts the new ThreatItem[] shape, a legacy plain-text string (split into
 * sentences), or an array of strings, and returns normalized ThreatItem[].
 */
function normalizeThreatLandscape(value: unknown): ThreatItem[] {
  if (typeof value === "string") {
    return value
      .split(/(?<=\.)\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ id: createId("threat"), text, detail: "", trend: "stable" as DomainTrend }));
  }
  return normalizeListItems(value, "threat");
}

// ThreatItem and DomainItem share the same shape, so one normalizer serves both.
function normalizeListItems(value: unknown, idPrefix: string): DomainItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item): DomainItem | null => {
      if (typeof item === "string") {
        return { id: createId(idPrefix), text: item, detail: "", trend: "stable" };
      }
      if (item && typeof item === "object") {
        const record = item as Partial<DomainItem>;
        return {
          id: record.id || createId(idPrefix),
          text: typeof record.text === "string" ? record.text : "",
          detail: typeof record.detail === "string" ? record.detail : "",
          trend: asTrend(record.trend),
        };
      }
      return null;
    })
    .filter((item): item is DomainItem => Boolean(item) && item!.text.length > 0);
}

function normalizeDomainItems(value: unknown): DomainItem[] {
  return normalizeListItems(value, "item");
}

function normalizeInitiatives(value: unknown): Initiative[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const record = (item || {}) as Partial<Initiative>;
    return {
      id: record.id || createId("initiative"),
      name: typeof record.name === "string" ? record.name : "",
      status: record.status || "on-track",
      progress: Number.isFinite(record.progress) ? Number(record.progress) : 0,
      statusNote: typeof record.statusNote === "string" ? record.statusNote : "",
      blockers: typeof record.blockers === "string" ? record.blockers : "",
    };
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
    title: typeof input.title === "string" ? input.title : "",
    presenter: typeof input.presenter === "string" ? input.presenter : "",
    participants: Array.isArray(input.participants)
      ? input.participants.filter((name): name is string => typeof name === "string")
      : [],
    showRiskMatrix: input.showRiskMatrix !== false,
    executiveSummary: input.executiveSummary || "",
    executiveSummaryHighlight: input.executiveSummaryHighlight || "",
    topRisks: Array.isArray(input.topRisks) ? input.topRisks : [],
    threatLandscape: normalizeThreatLandscape(input.threatLandscape),
    kpis: Array.isArray(input.kpis) ? input.kpis : [],
    incidents: Array.isArray(input.incidents) ? input.incidents : [],
    processItems: normalizeDomainItems(input.processItems),
    humanItems: normalizeDomainItems(input.humanItems),
    technologyItems: normalizeDomainItems(input.technologyItems),
    initiatives: normalizeInitiatives(input.initiatives),
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
