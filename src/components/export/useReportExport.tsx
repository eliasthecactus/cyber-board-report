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

/** What to export: the slides of the report's deck unless a caller supplies its own. */
export interface ExportSource {
  slideCount: number;
  renderSlide: (index: number) => ReactNode;
  fileStem: string;
}

function deckSource(report: Report): ExportSource {
  return {
    slideCount: visibleSlides(report).length,
    renderSlide: (index) => <SlideRenderer report={report} slideIndex={index} />,
    fileStem: reportFileStem(report),
  };
}

/**
 * Vector PDF through the browser's print dialog ("Save as PDF"): text stays
 * selectable and searchable, charts stay sharp, and files are small.
 */
async function printSlides(
  source: ExportSource,
  mount: (source: ExportSource) => void,
  getRoot: () => HTMLElement | null,
) {
  flushSync(() => mount(source));
  const root = getRoot();
  if (!root) {
    return;
  }
  await waitForSlideReady(root);
  const previousTitle = document.title;
  // Browsers use the document title as the suggested file name.
  document.title = source.fileStem;
  document.documentElement.classList.add("printing-slides");
  try {
    window.print();
  } finally {
    document.documentElement.classList.remove("printing-slides");
    document.title = previousTitle;
  }
}

/**
 * Shared export logic for the dashboard, the slide viewer and the brief editor.
 * Returns the `host` element, which must be rendered by the page: it holds the
 * hidden slides that are captured (image PDF) or printed (vector PDF).
 */
export function useReportExport(onError: (error: unknown) => void) {
  const t = useT();
  const lang = useLanguage();
  const { settings } = useSettings();
  const [state, setState] = useState<ExportState | null>(null);
  const [imageSlide, setImageSlide] = useState<ReactNode>(null);
  const [printSource, setPrintSource] = useState<ExportSource | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  const start = useCallback(
    async (report: Report, format: ExportFormat, customSource?: ExportSource) => {
      const source = customSource ?? deckSource(report);
      const total = source.slideCount;
      setState({ reportId: report.id, format, done: 0, total });
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        if (format === "pptx") {
          const blob = await buildPptx(report, settings, t, lang);
          downloadBlob(`${source.fileStem}.pptx`, blob);
        } else if (format === "pdf-print") {
          await printSlides(source, setPrintSource, () => printRef.current);
        } else {
          const blob = await buildImagePdf({
            slideCount: total,
            signal: controller.signal,
            onProgress: (done) => setState((current) => (current ? { ...current, done } : current)),
            renderSlide: async (index) => {
              flushSync(() => setImageSlide(source.renderSlide(index)));
              return hostRef.current?.firstElementChild as HTMLElement | null;
            },
          });
          downloadBlob(`${source.fileStem}.pdf`, blob);
        }
      } catch (error) {
        if (!(error instanceof ExportCancelledError)) {
          console.error("Export failed:", error);
          onError(error);
        }
      } finally {
        abortRef.current = null;
        setImageSlide(null);
        setPrintSource(null);
        setState(null);
      }
    },
    [settings, t, lang, onError],
  );

  const host: ReactNode = (
    <>
      <div ref={hostRef} aria-hidden style={offscreen}>
        {imageSlide}
      </div>
      {printSource &&
        createPortal(
          <div ref={printRef} className="print-root" aria-hidden>
            {Array.from({ length: printSource.slideCount }, (_, index) => (
              <div key={index} className="print-slide">
                {printSource.renderSlide(index)}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );

  return { state, start, cancel, host };
}
