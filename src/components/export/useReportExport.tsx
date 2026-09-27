import { useCallback, useRef, useState, type ReactNode } from "react";
import { createPortal, flushSync } from "react-dom";
import type { Report } from "@/types";
import SlideRenderer from "@/components/slides/SlideRenderer";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/components/slides/slideConstants";
import { visibleSlides } from "@/components/slides/slideRegistry";
import { buildImagePdf, ExportCancelledError, waitForSlideReady } from "@/lib/exportPdf";
import { buildPptx } from "@/lib/exportPptx";
import { downloadBlob, reportFileStem } from "@/lib/files";
import { useLanguage, useT } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";

export type ExportFormat = "pdf-print" | "pdf-image" | "pptx";

export interface ExportState {
  reportId: string;
  format: ExportFormat;
  /** Slides finished so far, for the image PDF progress indicator. */
  done: number;
  total: number;
}

const offscreen = {
  position: "fixed",
  top: 0,
  left: -100000,
  width: SLIDE_WIDTH,
  height: SLIDE_HEIGHT,
  pointerEvents: "none",
} as const;

/**
 * Vector PDF through the browser's print dialog ("Save as PDF"): text stays
 * selectable and searchable, charts stay sharp, and files are small.
 */
async function printSlides(
  report: Report,
  mount: (report: Report) => void,
  getRoot: () => HTMLElement | null,
) {
  flushSync(() => mount(report));
  const root = getRoot();
  if (!root) {
    return;
  }
  await waitForSlideReady(root);
  const previousTitle = document.title;
  // Browsers use the document title as the suggested file name.
  document.title = reportFileStem(report);
  document.documentElement.classList.add("printing-slides");
  try {
    window.print();
  } finally {
    document.documentElement.classList.remove("printing-slides");
    document.title = previousTitle;
  }
}

/**
 * Shared export logic for the dashboard and the slide viewer. Returns the
 * `host` element, which must be rendered by the page: it holds the hidden
 * slides that are captured (image PDF) or printed (vector PDF).
 */
export function useReportExport(onError: (error: unknown) => void) {
  const t = useT();
  const lang = useLanguage();
  const { settings } = useSettings();
  const [state, setState] = useState<ExportState | null>(null);
  const [imageSlide, setImageSlide] = useState<{ report: Report; index: number } | null>(null);
  const [printReport, setPrintReport] = useState<Report | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  const start = useCallback(
    async (report: Report, format: ExportFormat) => {
      const total = visibleSlides(report).length;
      setState({ reportId: report.id, format, done: 0, total });
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        if (format === "pptx") {
          const blob = await buildPptx(report, settings, t, lang);
          downloadBlob(`${reportFileStem(report)}.pptx`, blob);
        } else if (format === "pdf-print") {
          await printSlides(report, setPrintReport, () => printRef.current);
        } else {
          const blob = await buildImagePdf({
            slideCount: total,
            signal: controller.signal,
            onProgress: (done) => setState((current) => (current ? { ...current, done } : current)),
            renderSlide: async (index) => {
              flushSync(() => setImageSlide({ report, index }));
              return hostRef.current?.firstElementChild as HTMLElement | null;
            },
          });
          downloadBlob(`${reportFileStem(report)}.pdf`, blob);
        }
      } catch (error) {
        if (!(error instanceof ExportCancelledError)) {
          console.error("Export failed:", error);
          onError(error);
        }
      } finally {
        abortRef.current = null;
        setImageSlide(null);
        setPrintReport(null);
        setState(null);
      }
    },
    [settings, t, lang, onError],
  );

  const slideCount = printReport ? visibleSlides(printReport).length : 0;
  const host: ReactNode = (
    <>
      <div ref={hostRef} aria-hidden style={offscreen}>
        {imageSlide && <SlideRenderer report={imageSlide.report} slideIndex={imageSlide.index} />}
      </div>
      {printReport &&
        createPortal(
          <div ref={printRef} className="print-root" aria-hidden>
            {Array.from({ length: slideCount }, (_, index) => (
              <div key={index} className="print-slide">
                <SlideRenderer report={printReport} slideIndex={index} />
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );

  return { state, start, cancel, host };
}
