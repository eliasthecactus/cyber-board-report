import type { Report } from "@/types";
import { useT } from "@/lib/i18n";
import { SlidePageContext } from "./SlideFrame";
import { visibleSlides } from "./slideRegistry";

interface SlideRendererProps {
  report: Report;
  /** Index into the report's visible slides (see `visibleSlides`). */
  slideIndex: number;
}

export default function SlideRenderer({ report, slideIndex }: SlideRendererProps) {
  const t = useT();
  const slides = visibleSlides(report);
  const slide = slides[slideIndex];

  if (!slide) {
    return <div>{t("slide.notFound")}</div>;
  }

  const Slide = slide.component;
  return (
    <SlidePageContext.Provider value={{ page: slideIndex + 1, total: slides.length }}>
      <Slide report={report} />
    </SlidePageContext.Provider>
  );
}
