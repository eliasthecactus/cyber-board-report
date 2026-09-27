import type { InitiativeStatus, Level, Trend } from "@/types";

/**
 * Every fixed colour used on slides, in one place so the HTML slides and the
 * PowerPoint export stay identical. All badge colours pass WCAG AA (4.5:1)
 * with white text.
 */
export const palette = {
  text: "#0f172a",
  body: "#475569",
  muted: "#64748b",
  faint: "#94a3b8",
  surface: "#f8fafc",
  border: "#e2e8f0",
  white: "#ffffff",
  good: "#047857",
  goodBg: "#ecfdf5",
  bad: "#b91c1c",
  badBg: "#fef2f2",
  neutral: "#64748b",
  neutralBg: "#f1f5f9",
  blocker: "#be123c",
} as const;

export const levelColor: Record<Level, string> = {
  critical: "#9f1239",
  high: "#92400e",
  medium: "#1e3a5f",
  low: "#065f46",
};

export const statusColor: Record<InitiativeStatus, string> = {
  "on-track": "#065f46",
  "at-risk": "#92400e",
  delayed: "#9f1239",
  "not-started": "#64748b",
};

export const riskTrendColor: Record<Trend, string> = {
  worsening: "#b91c1c",
  improving: "#047857",
  stable: "#94a3b8",
};

/** Heat-map cell colours for the likelihood × impact matrix. */
export const matrixCell = {
  green: { bg: "#ecfdf5", fg: "#065f46" },
  yellow: { bg: "#fffbeb", fg: "#92400e" },
  orange: { bg: "#fff7ed", fg: "#9a3412" },
  red: { bg: "#fef2f2", fg: "#991b1b" },
} as const;

export type MatrixTone = keyof typeof matrixCell;

const MATRIX: Record<Level, Record<Level, MatrixTone>> = {
  low: { low: "green", medium: "yellow", high: "orange", critical: "red" },
  medium: { low: "yellow", medium: "orange", high: "red", critical: "red" },
  high: { low: "orange", medium: "red", high: "red", critical: "red" },
  critical: { low: "red", medium: "red", high: "red", critical: "red" },
};

export function matrixTone(likelihood: Level, impact: Level): MatrixTone {
  return MATRIX[likelihood][impact];
}

export const riskStatColor = {
  critical: "#9f1239",
  worsening: "#9a3412",
  improving: "#065f46",
} as const;
