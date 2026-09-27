import type { ComponentType } from "react";
import type { Report, ReportSection } from "@/types";
import TitleSlide from "./slides/TitleSlide";
import ExecutiveSummarySlide from "./slides/ExecutiveSummarySlide";
import TopRisksSlide from "./slides/TopRisksSlide";
import ThreatLandscapeSlide from "./slides/ThreatLandscapeSlide";
import KPISlide from "./slides/KPISlide";
import IncidentsSlide from "./slides/IncidentsSlide";
import ProcessSlide from "./slides/ProcessSlide";
import HumanSlide from "./slides/HumanSlide";
import TechnologySlide from "./slides/TechnologySlide";
import InitiativesSlide from "./slides/InitiativesSlide";
import OutlookSlide from "./slides/OutlookSlide";
import DecisionsSlide from "./slides/DecisionsSlide";
import { SLIDE_LIMITS } from "./slideConstants";

export type SlideId =
  | "title"
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

export interface SlideDefinition {
  id: SlideId;
  /** The editor section whose content this slide shows ("details" for the title slide). */
  section: ReportSection | "details";
  component: ComponentType<{ report: Report }>;
  /** True when the section has nothing to show; such slides can be hidden. */
  isEmpty: (report: Report) => boolean;
  /** Items in the section vs. how many fit, when the slide shows a subset. */
  capacity?: (report: Report) => { total: number; max: number };
}

const filled = (items: { text: string }[]) => items.filter((item) => item.text.trim());

export const SLIDES: readonly SlideDefinition[] = [
  { id: "title", section: "details", component: TitleSlide, isEmpty: () => false },
  {
    id: "executiveSummary",
    section: "executiveSummary",
    component: ExecutiveSummarySlide,
    isEmpty: (r) => !r.executiveSummary.trim() && !r.executiveSummaryHighlight?.trim(),
  },
  {
    id: "topRisks",
    section: "topRisks",
    component: TopRisksSlide,
    isEmpty: (r) => r.topRisks.length === 0,
    capacity: (r) => ({
      total: r.topRisks.length,
      max: r.showRiskMatrix ? SLIDE_LIMITS.risksWithMatrix : SLIDE_LIMITS.risksWithoutMatrix,
    }),
  },
  {
    id: "threatLandscape",
    section: "threatLandscape",
    component: ThreatLandscapeSlide,
    isEmpty: (r) => filled(r.threatLandscape).length === 0,
    capacity: (r) => ({ total: filled(r.threatLandscape).length, max: SLIDE_LIMITS.threats }),
  },
  {
    id: "kpis",
    section: "kpis",
    component: KPISlide,
    isEmpty: (r) => r.kpis.length === 0,
    capacity: (r) => ({ total: r.kpis.length, max: SLIDE_LIMITS.kpis }),
  },
  {
    id: "incidents",
    section: "incidents",
    component: IncidentsSlide,
    isEmpty: (r) => r.incidents.length === 0,
    capacity: (r) => ({ total: r.incidents.length, max: SLIDE_LIMITS.incidents }),
  },
  {
    id: "processItems",
    section: "processItems",
    component: ProcessSlide,
    isEmpty: (r) => filled(r.processItems).length === 0,
    capacity: (r) => ({ total: filled(r.processItems).length, max: SLIDE_LIMITS.domainItems }),
  },
  {
    id: "humanItems",
    section: "humanItems",
    component: HumanSlide,
    isEmpty: (r) => filled(r.humanItems).length === 0,
    capacity: (r) => ({ total: filled(r.humanItems).length, max: SLIDE_LIMITS.domainItems }),
  },
  {
    id: "technologyItems",
    section: "technologyItems",
    component: TechnologySlide,
    isEmpty: (r) => filled(r.technologyItems).length === 0,
    capacity: (r) => ({ total: filled(r.technologyItems).length, max: SLIDE_LIMITS.domainItems }),
  },
  {
    id: "initiatives",
    section: "initiatives",
    component: InitiativesSlide,
    isEmpty: (r) => r.initiatives.length === 0,
    capacity: (r) => ({ total: r.initiatives.length, max: SLIDE_LIMITS.initiatives }),
  },
  {
    id: "outlook",
    section: "outlook",
    component: OutlookSlide,
    isEmpty: (r) => !r.outlook.trim() && r.emergingRisks.length === 0,
    capacity: (r) => ({ total: r.emergingRisks.length, max: SLIDE_LIMITS.emergingRisks }),
  },
  {
    id: "decisionsRequired",
    section: "decisionsRequired",
    component: DecisionsSlide,
    isEmpty: (r) => r.decisionsRequired.length === 0,
    capacity: (r) => ({ total: r.decisionsRequired.length, max: SLIDE_LIMITS.decisions }),
  },
];

/** The slides that make up this report's deck, honouring "hide empty slides". */
export function visibleSlides(report: Report): SlideDefinition[] {
  return report.hideEmptySlides ? SLIDES.filter((slide) => !slide.isEmpty(report)) : [...SLIDES];
}

export function slideForSection(section: ReportSection | "details"): SlideDefinition | undefined {
  return SLIDES.find((slide) => slide.section === section);
}
