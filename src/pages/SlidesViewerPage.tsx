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
import type { Report } from "@/types";
import { navigateTo } from "@/lib/navigation";
import { getReport } from "@/lib/storage";

interface SlidesViewerPageProps {
  reportId: string;
}

const totalSlides = 13;

export default function SlidesViewerPage({ reportId }: SlidesViewerPageProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPresenting, setIsPresenting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

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
    if (!report || !slideRef.current) {
      return;
    }

    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let slideIndex = 0; slideIndex < totalSlides; slideIndex += 1) {
        if (slideIndex > 0) {
          pdf.addPage();
        }

        setCurrentSlide(slideIndex);
        await new Promise((resolve) => window.setTimeout(resolve, 750));

        const slidePreview = slideRef.current.querySelector(
          "[data-slide-preview]",
        ) as HTMLElement | null;
        if (!slidePreview) {
          continue;
        }

        const canvas = await html2canvas(slidePreview, {
          backgroundColor: "#ffffff",
          scale: 1.5,
          allowTaint: true,
          useCORS: true,
        });

        const imgWidth = pageWidth - 4;
        const imgHeight = (canvas.height / canvas.width) * imgWidth;
        const yPosition = Math.max(1, (pageHeight - imgHeight) / 2);
        const imageData = canvas.toDataURL("image/png");

        pdf.addImage(imageData, "PNG", 2, yPosition, imgWidth, imgHeight);
      }

      setCurrentSlide(0);
      pdf.save(`${report.quarter}-${report.year}-board-report.pdf`);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg" aria-label="Loading" />
      </main>
    );
  }

  if (!report) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center p-6">
        <section className="w-full max-w-md rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
          <h1 className="mb-3 text-xl font-bold">Report not found</h1>
          <button className="btn btn-primary" onClick={() => navigateTo("/")}>
            Back to dashboard
          </button>
        </section>
      </main>
    );
  }

  if (isPresenting) {
    return (
      <>
        <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-auto bg-black">
          <SlideRenderer report={report} slideIndex={currentSlide} compact={false} />
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
              {report.quarter} {report.year} - Slide Preview
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button className="btn btn-primary btn-sm gap-2" onClick={() => setIsPresenting(true)}>
              <Play size={16} />
              Present
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
              {exporting ? "Exporting" : "PDF"}
            </button>
            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => navigateTo(`/editor/${encodeURIComponent(report.id)}`)}
            >
              <Edit2 size={16} />
              Edit
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-5" ref={slideRef}>
          <section
            className="min-h-[70vh] overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-sm"
            data-slide-preview
          >
            <SlideRenderer report={report} slideIndex={currentSlide} compact={false} />
          </section>

          <nav className="rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
            <div className="mb-3 border-b border-base-300 pb-3 text-center text-sm font-medium text-base-content/60">
              Slide {currentSlide + 1} of {totalSlides}
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
    </main>
  );
}
