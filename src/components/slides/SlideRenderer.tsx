import { Report } from "@/types";
import { useT } from "@/lib/i18n";
import { SlidePageContext } from "./SlideFrame";
import { TOTAL_SLIDES } from "./slideConstants";
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

interface SlideRendererProps {
  report: Report;
  slideIndex: number;
}

export default function SlideRenderer({ report, slideIndex }: SlideRendererProps) {
  const t = useT();
  const slides = [
    <TitleSlide key="title" report={report} />,
    <ExecutiveSummarySlide key="exec" report={report} />,
    <TopRisksSlide key="risks" report={report} />,
    <ThreatLandscapeSlide key="threat" report={report} />,
    <KPISlide key="kpi" report={report} />,
    <IncidentsSlide key="incidents" report={report} />,
    <ProcessSlide key="process" report={report} />,
    <HumanSlide key="human" report={report} />,
    <TechnologySlide key="technology" report={report} />,
    <InitiativesSlide key="initiatives" report={report} />,
    <OutlookSlide key="outlook" report={report} />,
    <DecisionsSlide key="decisions" report={report} />,
  ];

  return (
    <SlidePageContext.Provider value={{ page: slideIndex + 1, total: TOTAL_SLIDES }}>
      {slides[slideIndex] || <div>{t("slide.notFound")}</div>}
    </SlidePageContext.Provider>
  );
}
