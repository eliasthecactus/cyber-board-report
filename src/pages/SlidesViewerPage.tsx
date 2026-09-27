import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Edit2, Loader2, Play, X } from "lucide-react";
import SlideRenderer from "@/components/slides/SlideRenderer";
import { SlideStage } from "@/components/slides/SlideStage";
import { visibleSlides } from "@/components/slides/slideRegistry";
import ExportDialog from "@/components/export/ExportDialog";
import { ExportProgress } from "@/components/export/ExportProgress";
import { useReportExport } from "@/components/export/useReportExport";
import { PageMessage, PageSpinner } from "@/components/ui/PageState";
import { Toast } from "@/components/ui/Toast";
import type { Report } from "@/types";
import { navigateTo } from "@/lib/navigation";
import { getReport, saveReport } from "@/lib/storage";
import { describeError } from "@/lib/errors";
import { useT } from "@/lib/i18n";

interface SlidesViewerPageProps {
  reportId: string;
}

export default function SlidesViewerPage({ reportId }: SlidesViewerPageProps) {
  const t = useT();
  const [report, setReport] = useState<Report | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPresenting, setIsPresenting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const handleExportError = useCallback((error: unknown) => setMessage(describeError(t, error)), [t]);
  const exporter = useReportExport(handleExportError);

  const totalSlides = report ? visibleSlides(report).length : 0;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const storedReport = await getReport(reportId);
        if (!cancelled) setReport(storedReport);
      } catch (error) {
        if (!cancelled) setMessage(describeError(t, error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [reportId, t]);

  // Keep the current slide in range when the slide count changes.
  useEffect(() => {
    setCurrentSlide((slide) => Math.min(slide, Math.max(totalSlides - 1, 0)));
  }, [totalSlides]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      // Don't hijack keys while a dialog or form field has focus.
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, select, textarea, [role=dialog]")) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "PageDown" || (isPresenting && event.key === " ")) {
        event.preventDefault();
        setCurrentSlide((slide) => Math.min(slide + 1, totalSlides - 1));
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        setCurrentSlide((slide) => Math.max(slide - 1, 0));
      }
      if (event.key === "Home") setCurrentSlide(0);
      if (event.key === "End") setCurrentSlide(totalSlides - 1);
      if (event.key === "Escape") setIsPresenting(false);
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [totalSlides, isPresenting]);

  const toggleHideEmpty = async (hideEmptySlides: boolean) => {
    if (!report) return;
    const updated = { ...report, hideEmptySlides, updatedAt: new Date().toISOString() };
    setReport(updated);
    setCurrentSlide(0);
    try {
      await saveReport(updated);
    } catch (error) {
      setMessage(describeError(t, error));
    }
  };

  if (loading) {
    return <PageSpinner />;
  }

  if (!report) {
    return <PageMessage title={message ?? t("editor.reportNotFound")} />;
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
            aria-label={t("slidesView.previous")}
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <span className="tabular-nums" aria-live="polite">
            {currentSlide + 1} / {totalSlides}
          </span>
          <button
            onClick={() => setCurrentSlide((slide) => Math.min(slide + 1, totalSlides - 1))}
            disabled={currentSlide === totalSlides - 1}
            className="rounded p-1 hover:bg-white/10 disabled:opacity-30"
            aria-label={t("slidesView.next")}
          >
            <ChevronRight size={18} aria-hidden />
          </button>
          <div className="mx-1 h-4 w-px bg-white/20" />
          <button
            onClick={() => setIsPresenting(false)}
            className="rounded p-1 hover:bg-white/10"
            aria-label={t("slidesView.exitPresentation")}
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      </>
    );
  }

  const exporting = exporter.state !== null;

  return (
    <main className="app-shell min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon"
              onClick={() => navigateTo("/")}
              aria-label={t("common.backToDashboard")}
              title={t("common.backToDashboard")}
            >
              <ArrowLeft size={16} aria-hidden />
            </button>
            <h1 className="truncate text-base font-bold text-slate-900">
              {t("slidesView.title", { quarter: report.quarter, year: report.year })}
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button className="cbr-btn cbr-btn-primary cbr-btn-sm" onClick={() => setIsPresenting(true)}>
              <Play size={14} aria-hidden />
              {t("slidesView.present")}
            </button>
            <button
              className="cbr-btn cbr-btn-success cbr-btn-sm"
              onClick={() => setExportDialogOpen(true)}
              disabled={exporting}
            >
              {exporting ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Download size={14} aria-hidden />}
              {exporting ? t("slidesView.exporting") : t("slidesView.export")}
            </button>
            <button
              className="cbr-btn cbr-btn-ghost cbr-btn-sm"
              onClick={() => navigateTo(`/editor/${encodeURIComponent(report.id)}`)}
            >
              <Edit2 size={14} aria-hidden />
              {t("dashboard.edit")}
            </button>
          </div>
        </div>
      </header>

      {/* Slide preview */}
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-5">
          <section
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            aria-label={t("slidesView.slideOf", { current: currentSlide + 1, total: totalSlides })}
          >
            <SlideStage mode="width">
              <SlideRenderer report={report} slideIndex={currentSlide} />
            </SlideStage>
          </section>

          {/* Slide navigation */}
          <nav className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-label={t("slidesView.navigation")}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <span className="text-sm font-medium text-slate-600">
                {t("slidesView.slideOf", { current: currentSlide + 1, total: totalSlides })}
              </span>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={report.hideEmptySlides}
                  onChange={(e) => void toggleHideEmpty(e.target.checked)}
                />
                {t("ed.details.hideEmpty")}
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  aria-current={index === currentSlide ? "true" : undefined}
                  aria-label={t("slidesView.goTo", { number: index + 1 })}
                  className={`h-8 min-w-9 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                    index === currentSlide
                      ? "border-primary bg-primary text-primary-foreground"
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

      {exportDialogOpen && (
        <ExportDialog
          reportLabel={`${report.quarter} ${report.year}`}
          onCancel={() => setExportDialogOpen(false)}
          onChoose={(format) => {
            setExportDialogOpen(false);
            void exporter.start(report, format);
          }}
        />
      )}

      {exporter.state && <ExportProgress state={exporter.state} onCancel={exporter.cancel} />}
      {message && <Toast message={message} onDismiss={() => setMessage(null)} />}
      {exporter.host}
    </main>
  );
}
