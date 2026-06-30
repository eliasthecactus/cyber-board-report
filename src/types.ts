// Data type definitions for the Cyber Board Report system

export type Likelihood = "low" | "medium" | "high" | "critical";
export type Impact = "low" | "medium" | "high" | "critical";
export type Trend = "improving" | "stable" | "worsening";
export type TrendDirection = "up" | "down" | "stable";
export type InitiativeStatus = "on-track" | "at-risk" | "delayed" | "not-started";

/** Direction indicator for threat / domain items: increasing, steady, or decreasing. */
export type DomainTrend = "more" | "stable" | "less";

export interface Risk {
  id: string;
  name: string;
  likelihood: Likelihood;
  businessImpact: Impact;
  trend: Trend;
  description?: string;
  historicalData: HistoricalRisk[];
}

export interface HistoricalRisk {
  quarter: string;
  likelihood: Likelihood;
  impact: Impact;
}

export interface KPI {
  id: string;
  name: string;
  unit: string;
  value: number;
  trend: TrendDirection;
  targetValue?: number;
  direction?: "higher" | "lower"; // "higher" = better (training %), "lower" = better (MTTD, incidents)
  historicalData: HistoricalKPI[];
}

export interface HistoricalKPI {
  quarter: string;
  value: number;
}

export interface Incident {
  id: string;
  title: string;
  severity?: "low" | "medium" | "high" | "critical";
  businessImpact: string;
  outcome: string;
  lessonsLearned: string;
  quarter: string;
}

export interface Initiative {
  id: string;
  name: string;
  status: InitiativeStatus;
  progress: number; // 0-100
  statusNote?: string; // free-text status update
  blockers?: string;
}

/** A single threat-landscape insight with a direction indicator. */
export interface ThreatItem {
  id: string;
  text: string; // short name / headline
  detail?: string; // optional supporting text
  trend: DomainTrend;
}

/**
 * An ongoing item in one of the three program domains (process / human /
 * technology) — e.g. a new process, a training rollout, a new technology.
 */
export interface DomainItem {
  id: string;
  text: string; // short name / headline
  detail?: string; // optional supporting text
  trend: DomainTrend;
}

export interface Decision {
  id: string;
  title: string;
  rationale: string;
  impact: string;
}

export interface EmergingRisk {
  description: string;
  impact: "low" | "medium" | "high" | "critical";
}

export interface Report {
  id: string;
  quarter: string;
  year: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  /** Report title shown on the title slide and in the footer. Empty = default. */
  title: string;
  /** Person presenting the report. Empty = falls back to createdBy. */
  presenter: string;
  /** Other people involved, shown on the title slide. */
  participants: string[];
  /** When false, the Top Risks slide hides the risk matrix and shows text only. */
  showRiskMatrix: boolean;
  executiveSummary: string;
  executiveSummaryHighlight?: string; // Key callout/headline
  topRisks: Risk[];
  threatLandscape: ThreatItem[];
  kpis: KPI[];
  incidents: Incident[];
  processItems: DomainItem[];
  humanItems: DomainItem[];
  technologyItems: DomainItem[];
  initiatives: Initiative[];
  outlook: string;
  emergingRisks?: EmergingRisk[]; // Key risks for outlook
  decisionsRequired: Decision[];
}

// Application settings (language, AI assist, redaction) ---------------------

export type AppLanguage = "en" | "de";

/**
 * A keyword that is swapped for a neutral placeholder before any text is sent
 * to the AI, and swapped back to the original value in the AI's response.
 * Lets users keep sensitive terms (company names, products, people) off the
 * wire while still benefiting from AI assistance.
 */
export interface RedactionRule {
  id: string;
  keyword: string; // original, sensitive value (e.g. "Acme Corp")
  placeholder: string; // neutral token sent to the AI (e.g. "[COMPANY]")
}

export interface AppSettings {
  language: AppLanguage;
  openRouterApiKey: string;
  openRouterModel: string;
  redactionRules: RedactionRule[];
  /** Optional company logo (data URL) shown on every presentation slide. */
  logo: string;
  /** Primary brand color used across the app and slides (hex). */
  primaryColor: string;
  updatedAt: string;
}

export type ReportSection =
  | "executiveSummary"
  | "topRisks"
  | "threatLandscape"
  | "kpis"
  | "incidents"
  | "processItems"
  | "humanItems"
  | "technologyItems"
  | "initiatives"
  | "outlook"
  | "decisionsRequired";
