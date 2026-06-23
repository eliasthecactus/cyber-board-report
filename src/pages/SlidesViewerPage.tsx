import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Play,
  X,
} from "lucide-react";
import SlideRenderer from "@/components/slides/SlideRenderer";
import { SlideStage } from "@/components/slides/SlideStage";
import { SLIDE_HEIGHT, SLIDE_WIDTH, TOTAL_SLIDES } from "@/components/slides/slideConstants";
import type { Report } from "@/types";
import { navigateTo } from "@/lib/navigation";
import { getReport } from "@/lib/storage";
import { useT } from "@/lib/i18n";

interface SlidesViewerPageProps {
  reportId: string;
}

const totalSlides = TOTAL_SLIDES;

export default function SlidesViewerPage({ reportId }: SlidesViewerPageProps) {
  const t = useT();
  const [report, setReport] = useState<Report | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPresenting, setIsPresenting] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Index of the slide currently rendered (full-size, off-screen) for PDF capture.
  const [exportSlide, setExportSlide] = useState<number | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const storedReport = await getReport(reportId);
      if (!cancelled) {
        setReport(storedReport);
        setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        setCurrentSlide((slide) => Math.min(slide + 1, totalSlides - 1));
      }
      if (event.key === "ArrowLeft") {
        setCurrentSlide((slide) => Math.max(slide - 1, 0));
      }
      if (event.key === "Escape") {
        setIsPresenting(false);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const exportToPDF = async () => {
    if (!report) {
      return;
    }

    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      // Make sure the embedded font is loaded before rasterizing any slide.
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [SLIDE_WIDTH, SLIDE_HEIGHT],
      });

      for (let slideIndex = 0; slideIndex < totalSlides; slideIndex += 1) {
        // Render the full-size (1280x720) slide off-screen, then wait for paint.
        setExportSlide(slideIndex);
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
        );
        await new Promise((resolve) => window.setTimeout(resolve, 250));

        const slideEl = exportRef.current?.firstElementChild as HTMLElement | null;
        if (!slideEl) {
          continue;
        }

        const canvas = await html2canvas(slideEl, {
          backgroundColor: "#ffffff",
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          scale: 2,
          useCORS: true,
        });

        if (slideIndex > 0) {
          pdf.addPage([SLIDE_WIDTH, SLIDE_HEIGHT], "landscape");
        }
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
      }

      setExportSlide(null);
      pdf.save(`${report.quarter}-${report.year}-board-report.pdf`);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExportSlide(null);
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg" aria-label={t("common.loading")} />
      </main>
    );
  }

  if (!report) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center p-6">
        <section className="w-full max-w-md rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
          <h1 className="mb-3 text-xl font-bold">{t("editor.reportNotFound")}</h1>
          <button className="btn btn-primary" onClick={() => navigateTo("/")}>
            {t("notFound.back")}
          </button>
        </section>
      </main>
    );
  }

  if (isPresenting) {
    return (
      <>
        <div className="fixed inset-0 z-[1000] bg-black">
          <SlideStage mode="contain">
            <SlideRenderer report={report} slideIndex={currentSlide} />
          </SlideStage>
        </div>
        <div className="fixed bottom-4 left-4 z-[1100] flex items-center gap-2 rounded bg-black/70 px-3 py-2 text-sm text-white">
          <button
            onClick={() => setCurrentSlide((slide) => Math.max(slide - 1, 0))}
            disabled={currentSlide === 0}
            className="btn btn-ghost btn-sm text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <span>
            {currentSlide + 1} / {totalSlides}
          </span>
          <button
            onClick={() => setCurrentSlide((slide) => Math.min(slide + 1, totalSlides - 1))}
            disabled={currentSlide === totalSlides - 1}
            className="btn btn-ghost btn-sm text-white"
          >
            <ChevronRight size={18} />
          </button>
          <button onClick={() => setIsPresenting(false)} className="btn btn-ghost btn-sm text-white">
            <X size={18} />
          </button>
        </div>
      </>
    );
  }

  return (
    <main className="app-shell min-h-screen">
      <header className="sticky top-0 z-40 border-b border-base-300 bg-base-100/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button className="btn btn-ghost btn-sm" onClick={() => navigateTo("/")}>
              <ArrowLeft size={18} />
            </button>
            <h1 className="truncate text-lg font-bold">
              {t("slidesView.title", { quarter: report.quarter, year: report.year })}
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button className="btn btn-primary btn-sm gap-2" onClick={() => setIsPresenting(true)}>
              <Play size={16} />
              {t("slidesView.present")}
            </button>
            <button
              className="btn btn-success btn-sm gap-2"
              onClick={() => void exportToPDF()}
              disabled={exporting}
            >
              {exporting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Download size={16} />
              )}
              {exporting ? t("slidesView.exporting") : t("slidesView.pdf")}
            </button>
            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => navigateTo(`/editor/${encodeURIComponent(report.id)}`)}
            >
              <Edit2 size={16} />
              {t("dashboard.edit")}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-5">
          <section className="overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-sm">
            <SlideStage mode="width">
              <SlideRenderer report={report} slideIndex={currentSlide} />
            </SlideStage>
          </section>

          <nav className="rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
            <div className="mb-3 border-b border-base-300 pb-3 text-center text-sm font-medium text-base-content/60">
              {t("slidesView.slideOf", { current: currentSlide + 1, total: totalSlides })}
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-9 min-w-10 rounded border px-3 text-xs font-medium transition ${
                    index === currentSlide
                      ? "border-primary bg-primary text-primary-content"
                      : "border-base-300 bg-base-100 text-base-content hover:border-primary"
                  }`}
                >
                  S{index + 1}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </section>

      {/* Off-screen full-size render used only for high-resolution PDF capture. */}
      <div
        ref={exportRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: -100000,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          pointerEvents: "none",
        }}
      >
        {exportSlide !== null && <SlideRenderer report={report} slideIndex={exportSlide} />}
      </div>
    </main>
  );
}
