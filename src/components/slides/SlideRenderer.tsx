import { Report } from "@/types";
import styles from "./SlideRenderer.module.css";
import TitleSlide from "./slides/TitleSlide";
import ExecutiveSummarySlide from "./slides/ExecutiveSummarySlide";
import TopRisksSlide from "./slides/TopRisksSlide";
import ThreatLandscapeSlide from "./slides/ThreatLandscapeSlide";
import KPISlide from "./slides/KPISlide";
import IncidentsSlide from "./slides/IncidentsSlide";
import ProgramStatusSlide from "./slides/ProgramStatusSlide";
import BudgetSlide from "./slides/BudgetSlide";
import ComplianceSlide from "./slides/ComplianceSlide";
import SupplyChainSlide from "./slides/SupplyChainSlide";
import InitiativesSlide from "./slides/InitiativesSlide";
import OutlookSlide from "./slides/OutlookSlide";
import DecisionsSlide from "./slides/DecisionsSlide";

interface SlideRendererProps {
  report: Report;
  slideIndex: number;
  compact?: boolean; // true = fixed aspect ratio (crop content), false = full page (scroll)
}

export default function SlideRenderer({ report, slideIndex, compact = true }: SlideRendererProps) {
  const slides = [
    <TitleSlide key="title" report={report} compact={compact} />,
    <ExecutiveSummarySlide key="exec" report={report} compact={compact} />,
    <TopRisksSlide key="risks" report={report} compact={compact} />,
    <ThreatLandscapeSlide key="threat" report={report} compact={compact} />,
    <KPISlide key="kpi" report={report} compact={compact} />,
    <IncidentsSlide key="incidents" report={report} compact={compact} />,
    <ProgramStatusSlide key="program" report={report} compact={compact} />,
    <BudgetSlide key="budget" report={report} compact={compact} />,
    <ComplianceSlide key="compliance" report={report} compact={compact} />,
    <SupplyChainSlide key="supply" report={report} compact={compact} />,
    <InitiativesSlide key="initiatives" report={report} compact={compact} />,
    <OutlookSlide key="outlook" report={report} compact={compact} />,
    <DecisionsSlide key="decisions" report={report} compact={compact} />,
  ];

  return (
    <div className={styles.slideWrapper}>
      <div className={styles.slide}>
        {slides[slideIndex] || <div>Slide not found</div>}
      </div>
    </div>
  );
}
