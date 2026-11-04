import type {
  Brief,
  BriefBlock,
  BriefBlockType,
  Decision,
  DomainItem,
  DomainTrend,
  EmergingRisk,
  HistoricalKPI,
  Incident,
  Initiative,
  InitiativeStatus,
  KPI,
  Level,
  Report,
  Risk,
  ThreatItem,
  Trend,
  TrendDirection,
} from "@/types";
import { BLOCK_SPECS, BRIEF_BLOCK_TYPES, canPlace, clampRect, MAX_BLOCK_ITEMS, MAX_BRIEF_SLIDES } from "@/lib/briefGrid";

/**
 * Version of the report data shape. Bump it whenever the shape changes and
 * teach `normalizeReport` to upgrade older data (see docs/data-model.md).
 *
 * 1 – threatLandscape was a free-text string
 * 2 – threatLandscape / domain items became structured lists
 * 3 – schemaVersion stored on each report, hideEmptySlides added,
 *     unused Risk.historicalData dropped
 * 4 – explainKpis and KPI.explanation added
 * 5 – brief added, Risk.mitigation and Risk.owner added
 */
export const REPORT_SCHEMA_VERSION = 5;

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
    schemaVersion: REPORT_SCHEMA_VERSION,
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
    hideEmptySlides: false,
    explainKpis: false,
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
    brief: null,
  };
}

export function cloneReport(report: Report, createdBy: string): Report {
  const now = new Date().toISOString();

  return normalizeReport({
    ...structuredClone(report),
    id: createId(),
    createdAt: now,
    updatedAt: now,
    createdBy,
  });
}

// ── Field coercion helpers ────────────────────────────────────────────────
// Imported files can be hand-edited or come from older versions, so every
// field is checked instead of trusted.

type Loose = Record<string, unknown>;

const LEVELS: readonly Level[] = ["low", "medium", "high", "critical"];
const RISK_TRENDS: readonly Trend[] = ["improving", "stable", "worsening"];
const DIRECTIONS: readonly TrendDirection[] = ["up", "down", "stable"];
const DOMAIN_TRENDS: readonly DomainTrend[] = ["more", "stable", "less"];
const STATUSES: readonly InitiativeStatus[] = ["on-track", "at-risk", "delayed", "not-started"];
export const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

function isObject(value: unknown): value is Loose {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/** A finite number, or `fallback` for NaN/Infinity/non-numbers. */
export function finiteNumber(value: unknown, fallback = 0): number {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : fallback;
}

function optionalNumber(value: unknown): number | undefined {
  const number = finiteNumber(value, Number.NaN);
  return Number.isNaN(number) ? undefined : number;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function objects(value: unknown): Loose[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function id(value: unknown, prefix: string): string {
  return typeof value === "string" && value ? value : createId(prefix);
}

// ── Section normalizers ───────────────────────────────────────────────────

function normalizeRisks(value: unknown): Risk[] {
  return objects(value).map((risk) => ({
    id: id(risk.id, "risk"),
    name: str(risk.name),
    likelihood: oneOf(risk.likelihood, LEVELS, "low"),
    businessImpact: oneOf(risk.businessImpact, LEVELS, "low"),
    trend: oneOf(risk.trend, RISK_TRENDS, "stable"),
    description: str(risk.description),
    mitigation: str(risk.mitigation),
    owner: str(risk.owner),
  }));
}

const PERIOD_PATTERN = /^Q([1-4])[\s-]?(\d{4})$/i;

function normalizeHistory(value: unknown): HistoricalKPI[] {
  return objects(value)
    .map((point) => {
      const match = str(point.quarter).trim().match(PERIOD_PATTERN);
      const number = optionalNumber(point.value);
      return match && number !== undefined
        ? { quarter: `Q${match[1]}-${match[2]}`, value: number }
        : null;
    })
    .filter((point): point is HistoricalKPI => point !== null);
}

function normalizeKpis(value: unknown): KPI[] {
  return objects(value).map((kpi) => ({
    id: id(kpi.id, "kpi"),
    name: str(kpi.name),
    unit: str(kpi.unit),
    value: finiteNumber(kpi.value),
    trend: oneOf(kpi.trend, DIRECTIONS, "stable"),
    targetValue: optionalNumber(kpi.targetValue),
    direction: oneOf(kpi.direction, ["higher", "lower"] as const, "higher"),
    explanation: str(kpi.explanation),
    historicalData: normalizeHistory(kpi.historicalData),
  }));
}

function normalizeIncidents(value: unknown): Incident[] {
  return objects(value).map((incident) => ({
    id: id(incident.id, "incident"),
    title: str(incident.title),
    severity: oneOf(incident.severity, LEVELS, "medium"),
    businessImpact: str(incident.businessImpact),
    outcome: str(incident.outcome),
    lessonsLearned: str(incident.lessonsLearned),
    quarter: str(incident.quarter),
  }));
}

function normalizeListItems(value: unknown, idPrefix: string): DomainItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item): DomainItem | null => {
      if (typeof item === "string") {
        return { id: createId(idPrefix), text: item, detail: "", trend: "stable" };
      }
      if (isObject(item)) {
        return {
          id: id(item.id, idPrefix),
          text: str(item.text),
          detail: str(item.detail),
          trend: oneOf(item.trend, DOMAIN_TRENDS, "stable"),
        };
      }
      return null;
    })
    .filter((item): item is DomainItem => item !== null && item.text.length > 0);
}

/**
 * Accepts the structured ThreatItem[] shape, a legacy (schema 1) plain-text
 * string split into sentences, or an array of strings.
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

function normalizeInitiatives(value: unknown): Initiative[] {
  return objects(value).map((initiative) => ({
    id: id(initiative.id, "initiative"),
    name: str(initiative.name),
    status: oneOf(initiative.status, STATUSES, "on-track"),
    progress: Math.min(100, Math.max(0, Math.round(finiteNumber(initiative.progress)))),
    statusNote: str(initiative.statusNote),
    blockers: str(initiative.blockers),
  }));
}

function normalizeEmergingRisks(value: unknown): EmergingRisk[] {
  return objects(value).map((risk) => ({
    description: str(risk.description),
    impact: oneOf(risk.impact, LEVELS, "medium"),
  }));
}

function normalizeDecisions(value: unknown): Decision[] {
  return objects(value).map((decision) => ({
    id: id(decision.id, "decision"),
    title: str(decision.title),
    rationale: str(decision.rationale),
    impact: str(decision.impact),
  }));
}

/** Keep only the option keys a block type knows, each with a valid value. */
function normalizeBlockOptions(type: BriefBlockType, value: unknown): Loose {
  const { options: defaults, enums } = BLOCK_SPECS[type];
  const input = isObject(value) ? value : {};
  const entries = Object.entries(defaults as Loose).map(([key, fallback]) => {
    const raw = input[key];
    if (Array.isArray(fallback)) {
      return [key, Array.isArray(raw) ? raw.filter((item) => typeof item === "string") : []];
    }
    if (typeof fallback === "boolean") {
      return [key, typeof raw === "boolean" ? raw : fallback];
    }
    if (typeof fallback === "number") {
      return [key, Math.min(MAX_BLOCK_ITEMS, Math.max(1, Math.round(finiteNumber(raw, fallback))))];
    }
    const allowed = enums?.[key];
    return [key, allowed ? oneOf(raw, allowed, fallback as string) : str(raw, fallback as string)];
  });
  return Object.fromEntries(entries);
}

function normalizeBlocks(value: unknown): BriefBlock[] {
  const blocks: BriefBlock[] = [];
  for (const raw of objects(value)) {
    if (!BRIEF_BLOCK_TYPES.includes(raw.type as BriefBlockType)) {
      continue;
    }
    const type = raw.type as BriefBlockType;
    const rect = clampRect(
      {
        x: Math.round(finiteNumber(raw.x)),
        y: Math.round(finiteNumber(raw.y)),
        w: Math.round(finiteNumber(raw.w, BLOCK_SPECS[type].w)),
        h: Math.round(finiteNumber(raw.h, BLOCK_SPECS[type].h)),
      },
      type,
    );
    // A hand-edited file can't make blocks overlap: the later one is dropped.
    if (canPlace(rect, blocks)) {
      blocks.push({
        id: id(raw.id, "block"),
        type,
        ...rect,
        title: str(raw.title),
        options: normalizeBlockOptions(type, raw.options),
      } as BriefBlock);
    }
  }
  return blocks;
}

function normalizeBrief(value: unknown): Brief | null {
  if (!isObject(value)) {
    return null;
  }
  const slides = objects(value.slides)
    .slice(0, MAX_BRIEF_SLIDES)
    .map((slide) => ({
      id: id(slide.id, "slide"),
      title: str(slide.title),
      blocks: normalizeBlocks(slide.blocks),
    }));
  if (slides.length === 0) {
    return null;
  }
  return {
    title: str(value.title),
    audience: str(value.audience),
    footerNote: str(value.footerNote),
    slides,
  };
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

/**
 * Turn any stored or imported report-like value into a valid, current-schema
 * Report. Unknown fields are dropped; missing or malformed ones get defaults.
 */
export function normalizeReport(input: Partial<Report> | Loose): Report {
  const raw = (isObject(input) ? input : {}) as Loose;
  const now = new Date().toISOString();
  const quarter: string = oneOf<string>(raw.quarter, QUARTERS, currentQuarter());
  const year = Math.round(finiteNumber(raw.year, new Date().getFullYear()));
  const createdAt = isIsoDate(raw.createdAt) ? raw.createdAt : now;

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    id: id(raw.id, "report"),
    quarter,
    year,
    createdAt,
    updatedAt: isIsoDate(raw.updatedAt) ? raw.updatedAt : createdAt,
    createdBy: str(raw.createdBy).trim() || "Local User",
    title: str(raw.title),
    presenter: str(raw.presenter),
    participants: Array.isArray(raw.participants)
      ? raw.participants.filter((name): name is string => typeof name === "string")
      : [],
    showRiskMatrix: raw.showRiskMatrix !== false,
    hideEmptySlides: raw.hideEmptySlides === true,
    explainKpis: raw.explainKpis === true,
    executiveSummary: str(raw.executiveSummary),
    executiveSummaryHighlight: str(raw.executiveSummaryHighlight),
    topRisks: normalizeRisks(raw.topRisks),
    threatLandscape: normalizeThreatLandscape(raw.threatLandscape),
    kpis: normalizeKpis(raw.kpis),
    incidents: normalizeIncidents(raw.incidents),
    processItems: normalizeListItems(raw.processItems, "item"),
    humanItems: normalizeListItems(raw.humanItems, "item"),
    technologyItems: normalizeListItems(raw.technologyItems, "item"),
    initiatives: normalizeInitiatives(raw.initiatives),
    outlook: str(raw.outlook),
    emergingRisks: normalizeEmergingRisks(raw.emergingRisks),
    decisionsRequired: normalizeDecisions(raw.decisionsRequired),
    brief: normalizeBrief(raw.brief),
  };
}

export function currentQuarter(date = new Date()): string {
  return `Q${Math.floor(date.getMonth() / 3) + 1}`;
}

export function quarterNumber(quarter: string): number {
  return Number(quarter.replace(/\D/g, "")) || 0;
}

/** Period label used for KPI history points, e.g. "Q3-2026". */
export function periodLabel(quarter: string | number, year: number): string {
  return `Q${quarterNumber(String(quarter))}-${year}`;
}

export function reportSortValue(report: Report): string {
  const quarterRank = report.quarter.replace(/\D/g, "").padStart(2, "0");
  return `${report.year}-${quarterRank}-${report.updatedAt}`;
}
