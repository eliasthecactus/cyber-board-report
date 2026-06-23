// PowerPoint 16:9 widescreen canvas. Every slide is authored at this exact
// pixel size, then scaled to fit the preview / fullscreen / PDF export.
export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

export const TOTAL_SLIDES = 13;

// Per-section accent colors used for header bars, icons and highlights.
export const ACCENTS = {
  title: "#2563eb",
  executiveSummary: "#4f46e5",
  topRisks: "#dc2626",
  threatLandscape: "#2563eb",
  kpis: "#7c3aed",
  incidents: "#d97706",
  programStatus: "#059669",
  budgetResources: "#16a34a",
  complianceAudit: "#0d9488",
  supplyChainRisk: "#ea580c",
  initiatives: "#0284c7",
  outlook: "#9333ea",
  decisionsRequired: "#4f46e5",
} as const;
