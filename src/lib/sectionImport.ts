import type { Report, ReportSection } from "@/types";
import { createId, quarterNumber } from "@/lib/reportFactory";

export type EditorSection = "details" | ReportSection;

/** Whether report `a` covers an earlier period than `current`. */
export function isEarlier(a: Report, current: Report): boolean {
  if (a.year !== current.year) return a.year < current.year;
  return quarterNumber(a.quarter) < quarterNumber(current.quarter);
}

/** The most recent report before `current`, used as the "import from" source. */
export function findPriorReport(reports: Report[], current: Report): Report | null {
  return (
    reports
      .filter((r) => r.id !== current.id && isEarlier(r, current))
      .sort((a, b) => (a.year !== b.year ? b.year - a.year : quarterNumber(b.quarter) - quarterNumber(a.quarter)))[0] ??
    null
  );
}

/** Clone an array of items giving each a fresh id, so copied rows stay unique. */
function withFreshIds<T extends { id: string }>(items: T[], prefix: string): T[] {
  return items.map((item) => ({ ...structuredClone(item), id: createId(prefix) }));
}

/** Build the patch that copies one section's content from a source report. */
export function sectionPatch(section: EditorSection, source: Report): Partial<Report> {
  switch (section) {
    case "details":
      return {
        title: source.title,
        presenter: source.presenter,
        participants: [...source.participants],
      };
    case "executiveSummary":
      return {
        executiveSummary: source.executiveSummary,
        executiveSummaryHighlight: source.executiveSummaryHighlight,
      };
    case "topRisks":
      return { topRisks: withFreshIds(source.topRisks, "risk") };
    case "threatLandscape":
      return { threatLandscape: withFreshIds(source.threatLandscape, "threat") };
    case "kpis":
      return { kpis: withFreshIds(source.kpis, "kpi") };
    case "incidents":
      return { incidents: withFreshIds(source.incidents, "incident") };
    case "processItems":
      return { processItems: withFreshIds(source.processItems, "process") };
    case "humanItems":
      return { humanItems: withFreshIds(source.humanItems, "human") };
    case "technologyItems":
      return { technologyItems: withFreshIds(source.technologyItems, "technology") };
    case "initiatives":
      return { initiatives: withFreshIds(source.initiatives, "initiative") };
    case "outlook":
      return { outlook: source.outlook, emergingRisks: structuredClone(source.emergingRisks) };
    case "decisionsRequired":
      return { decisionsRequired: withFreshIds(source.decisionsRequired, "decision") };
  }
}
