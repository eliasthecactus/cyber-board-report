import { createContext, useContext, type ReactNode } from "react";
import type { Report } from "@/types";

/**
 * Provides a textual summary of the current report so AI "Fill" actions can
 * draft one field using the content of the others. Defaults to empty (e.g. on
 * the settings page, where there is no report).
 */
const ReportContextValue = createContext<() => string>(() => "");

export function ReportContextProvider({
  getContext,
  children,
}: {
  getContext: () => string;
  children: ReactNode;
}) {
  return <ReportContextValue.Provider value={getContext}>{children}</ReportContextValue.Provider>;
}

export function useReportContext(): () => string {
  return useContext(ReportContextValue);
}

function joinList(items: string[]): string {
  return items.filter(Boolean).map((item) => `- ${item}`).join("\n");
}

/** Render a report as a readable plain-text block for use as AI context. */
export function serializeReportForAi(report: Report): string {
  const parts: string[] = [];
  parts.push(`Report: ${report.quarter} ${report.year}`);

  if (report.executiveSummary) {
    parts.push(`Executive summary: ${report.executiveSummary}`);
  }
  if (report.topRisks.length) {
    parts.push(
      `Top risks:\n${joinList(
        report.topRisks.map(
          (risk) =>
            `${risk.name} (likelihood: ${risk.likelihood}, impact: ${risk.businessImpact}, trend: ${risk.trend})` +
            (risk.description ? ` — ${risk.description}` : ""),
        ),
      )}`,
    );
  }
  if (report.threatLandscape.length) {
    parts.push(
      `Threat landscape:\n${joinList(
        report.threatLandscape.map((item) => `${item.text} (${item.trend})`),
      )}`,
    );
  }
  if (report.kpis.length) {
    parts.push(
      `KPIs:\n${joinList(
        report.kpis.map((kpi) => `${kpi.name}: ${kpi.value}${kpi.unit} (trend: ${kpi.trend})`),
      )}`,
    );
  }
  if (report.incidents.length) {
    parts.push(
      `Incidents:\n${joinList(
        report.incidents.map(
          (incident) =>
            `${incident.title}${incident.severity ? ` [${incident.severity}]` : ""}: ${incident.businessImpact}`,
        ),
      )}`,
    );
  }
  const domain = (label: string, items: typeof report.processItems) => {
    if (items.length) {
      parts.push(`${label}:\n${joinList(items.map((item) => `${item.text} (${item.trend})`))}`);
    }
  };
  domain("Process", report.processItems);
  domain("Human", report.humanItems);
  domain("Technology", report.technologyItems);
  if (report.initiatives.length) {
    parts.push(
      `Initiatives:\n${joinList(
        report.initiatives.map(
          (i) =>
            `${i.name} (${i.status}, ${i.progress}%)` +
            (i.statusNote ? ` — ${i.statusNote}` : "") +
            (i.blockers ? ` [blocked: ${i.blockers}]` : ""),
        ),
      )}`,
    );
  }
  if (report.outlook) {
    parts.push(`Outlook: ${report.outlook}`);
  }
  if (report.decisionsRequired.length) {
    parts.push(
      `Decisions required:\n${joinList(
        report.decisionsRequired.map((d) => `${d.title}: ${d.rationale}`),
      )}`,
    );
  }

  return parts.join("\n\n");
}
