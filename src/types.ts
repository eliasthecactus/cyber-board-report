// Data type definitions for the Cyber Board Report system

export type Likelihood = "low" | "medium" | "high" | "critical";
export type Impact = "low" | "medium" | "high" | "critical";
export type Trend = "improving" | "stable" | "worsening";
export type TrendDirection = "up" | "down" | "stable";
export type InitiativeStatus = "on-track" | "at-risk" | "delayed" | "not-started";

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
  blockers?: string;
}

export interface Decision {
  id: string;
  title: string;
  rationale: string;
  impact: string;
}

export interface ProgramStatus {
  status: "on-track" | "at-risk" | "at-critical-juncture";
  achievements: string[];
  challenges: string[];
}

export interface BudgetResources {
  budget: string;
  allocation: string;
  constraints: string;
}

export interface ComplianceAudit {
  status: "compliant" | "compliant-with-exceptions" | "non-compliant";
  findings: string[];
  gaps: string[];
}

export interface SupplyChainRisk {
  risks: string[];
  assessment: string;
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
  executiveSummary: string;
  executiveSummaryHighlight?: string; // Key callout/headline
  topRisks: Risk[];
  threatLandscape: string;
  kpis: KPI[];
  incidents: Incident[];
  programStatus: ProgramStatus;
  budgetResources: BudgetResources;
  complianceAudit: ComplianceAudit;
  supplyChainRisk: SupplyChainRisk;
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
  | "programStatus"
  | "budgetResources"
  | "complianceAudit"
  | "supplyChainRisk"
  | "initiatives"
  | "outlook"
  | "decisionsRequired";
