import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Loader2,
  Play,
  X,
} from "lucide-react";
import SlideRenderer from "@/components/slides/SlideRenderer";
import { SlideStage } from "@/components/slides/SlideStage";
import { SLIDE_HEIGHT, SLIDE_WIDTH, TOTAL_SLIDES } from "@/components/slides/slideConstants";
import type { Report } from "@/types";
import { navigateTo } from "@/lib/navigation";
import { getReport } from "@/lib/storage";
import { exportReportToPdf } from "@/lib/exportPdf";
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
    if (!report) return;
    setExporting(true);
    try {
      await exportReportToPdf(report, {
        onSlide: async (slideIndex) => {
          setExportSlide(slideIndex);
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
          return (exportRef.current?.firstElementChild as HTMLElement | null);
        },
        onDone: () => {
          setExportSlide(null);
          setExporting(false);
        },
      });
    } catch (error) {
      console.error("Export error:", error);
      setExportSlide(null);
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </main>
    );
  }

  if (!report) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center p-6">
        <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-3 text-xl font-bold text-slate-900">{t("editor.reportNotFound")}</h1>
          <button className="cbr-btn cbr-btn-primary" onClick={() => navigateTo("/")}>
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
        <div className="fixed bottom-4 left-4 z-[1100] flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2 text-sm text-white backdrop-blur-sm">
          <button
            onClick={() => setCurrentSlide((slide) => Math.max(slide - 1, 0))}
            disabled={currentSlide === 0}
            className="rounded p-1 hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="tabular-nums">
            {currentSlide + 1} / {totalSlides}
          </span>
          <button
            onClick={() => setCurrentSlide((slide) => Math.min(slide + 1, totalSlides - 1))}
            disabled={currentSlide === totalSlides - 1}
            className="rounded p-1 hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
          <div className="mx-1 h-4 w-px bg-white/20" />
          <button onClick={() => setIsPresenting(false)} className="rounded p-1 hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
      </>
    );
  }

  return (
    <main className="app-shell min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon" onClick={() => navigateTo("/")}>
              <ArrowLeft size={16} />
            </button>
            <h1 className="truncate text-base font-bold text-slate-900">
              {t("slidesView.title", { quarter: report.quarter, year: report.year })}
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button className="cbr-btn cbr-btn-primary cbr-btn-sm" onClick={() => setIsPresenting(true)}>
              <Play size={14} />
              {t("slidesView.present")}
            </button>
            <button
              className="cbr-btn cbr-btn-success cbr-btn-sm"
              onClick={() => void exportToPDF()}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              {exporting ? t("slidesView.exporting") : t("slidesView.pdf")}
            </button>
            <button
              className="cbr-btn cbr-btn-ghost cbr-btn-sm"
              onClick={() => navigateTo(`/editor/${encodeURIComponent(report.id)}`)}
            >
              <Edit2 size={14} />
              {t("dashboard.edit")}
            </button>
          </div>
        </div>
      </header>

      {/* Slide preview */}
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-5">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SlideStage mode="width">
              <SlideRenderer report={report} slideIndex={currentSlide} />
            </SlideStage>
          </section>

          {/* Slide navigation */}
          <nav className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 border-b border-slate-100 pb-3 text-center text-sm font-medium text-slate-500">
              {t("slidesView.slideOf", { current: currentSlide + 1, total: totalSlides })}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-8 min-w-9 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                    index === currentSlide
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </section>

      {/* Off-screen render for PDF export */}
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
